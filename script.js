const { PDFDocument, TextAlignment, PDFName, StandardFonts } = PDFLib;

const pdfUrl = './書面分析報告輸入版.pdf';
const fontUrl = './NotoSansTC-Regular.ttf';

let originalPdfBytes = null;
let originalFontBytes = null;
let debounceTimer; 

// 🛡️ 升級版文字小幫手：簡化參數，保留第6個參數 addPrefixSpace 處理前置空白
function fillField(form, fieldName, elementId, fontSize = 10, align = null, addPrefixSpace = false) {
    try {
        const field = form.getTextField(fieldName);
        const inputElement = document.getElementById(elementId);
        
        if (field && inputElement) {
            field.removeMaxLength();
            if (typeof field.disableCombing === 'function') field.disableCombing();
            
            if (align !== null) field.setAlignment(align);

            let finalValue = inputElement.value;
            if (finalValue !== '') {
                // 如果開啟了 addPrefixSpace，就在文字最前面加一個半形空白
                if (addPrefixSpace) finalValue = ' ' + finalValue; 
                finalValue = finalValue + ' '; // 結尾防呆空白，這招也能順便破解身分證的分散對齊！
            }
            
            field.setText(finalValue);
            if (fontSize !== null) field.setFontSize(fontSize); 
        }
    } catch (e) {}
}

// ✅ 打勾方塊小幫手
function fillCheckbox(form, fieldName, elementId) {
    try {
        const field = form.getCheckBox(fieldName);
        const inputElement = document.getElementById(elementId);
        if (field && inputElement) {
            inputElement.checked ? field.check() : field.uncheck();
        }
    } catch (e) {}
}

async function init() {
    try {
        const [pdfResponse, fontResponse] = await Promise.all([ fetch(pdfUrl), fetch(fontUrl) ]);
        originalPdfBytes = await pdfResponse.arrayBuffer();
        originalFontBytes = await fontResponse.arrayBuffer();
        await updatePreview();

        document.getElementById('pdfForm').addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updatePreview, 600); 
        });
        document.getElementById('downloadBtn').addEventListener('click', downloadPDF);
    } catch (error) { console.error("載入發生錯誤:", error); }
}

async function updatePreview() {
    if (!originalPdfBytes || !originalFontBytes) return;
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    pdfDoc.registerFontkit(window.fontkit);
    
    const customFont = await pdfDoc.embedFont(originalFontBytes);
    const form = pdfDoc.getForm();

    applyFormData(form);

    // 🌟 核心修復：把這行加回來！統一使用中文字型，防止存檔時遇到中文崩潰！
    form.updateFieldAppearances(customFont);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    document.getElementById('pdfPreview').src = URL.createObjectURL(blob);
}

async function downloadPDF() {
    if (!originalPdfBytes || !originalFontBytes) return;
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    pdfDoc.registerFontkit(window.fontkit);
    
    const customFont = await pdfDoc.embedFont(originalFontBytes);
    const form = pdfDoc.getForm();

    applyFormData(form);
    
    form.updateFieldAppearances(customFont); // 下載前也要統一字型
    form.flatten();
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '已完成_書面分析報告.pdf';
    a.click();
    URL.revokeObjectURL(url);
}

// 📦 資料綁定核心
function applyFormData(form) {
    // ------------------- 【文字輸入區】 -------------------
    // 1. 要保人/被保人基本資料/車輛 (大小10 + 靠左對齊)
    fillField(form, 'fill_16', 't_app_name', 10, TextAlignment.Left);
    fillField(form, 'fill_17', 't_app_id', 10, TextAlignment.Left);
    fillField(form, 'fill_18', 't_app_birth', 10, TextAlignment.Left);
    fillField(form, 'fill_19', 't_app_job', 10, TextAlignment.Left);
    
    fillField(form, 'fill_20', 't_ins_name', 10, TextAlignment.Left);
    fillField(form, 'fill_21', 't_ins_id', 10, TextAlignment.Left);
    fillField(form, 'fill_22', 't_ins_birth', 10, TextAlignment.Left);
    fillField(form, 'fill_23', 't_ins_job', 10, TextAlignment.Left);
    
    fillField(form, 'fill_24', 't_car_plate', 10, TextAlignment.Left);
    fillField(form, 'fill_25', 't_car_type', 10, TextAlignment.Left);
    
    // 2. 「其他」說明欄位 (字體縮小為 8 + 靠左對齊)
    fillField(form, 'fill_1', 't_rel_other', 8, TextAlignment.Left); 
    fillField(form, 'fill_2', 't_need_other', 8, TextAlignment.Left); 
    fillField(form, 'fill_3', 't_spec_company', 8, TextAlignment.Left);
    
    // 金額與日期 (大小10 + 置中對齊)
    fillField(form, 'Text5', 't_amt_1', 10, TextAlignment.Center);
    fillField(form, 'Text7', 't_amt_2', 10, TextAlignment.Center);
    fillField(form, 'Text6', 't_amt_3', 10, TextAlignment.Center);
    
    fillField(form, 'fill_4', 't_y1', 10, TextAlignment.Center);
    fillField(form, 'fill_5', 't_m1', 10, TextAlignment.Center);
    fillField(form, 'fill_6', 't_d1', 10, TextAlignment.Center);
    fillField(form, 'fill_7', 't_y2', 10, TextAlignment.Center);
    fillField(form, 'fill_8', 't_m2', 10, TextAlignment.Center);
    fillField(form, 'fill_9', 't_d2', 10, TextAlignment.Center);

    fillField(form, 'fill_10', 't_premium_amt', 10, TextAlignment.Center);
    
    // 其他來源/風險變更 (字體縮小為 8 + 靠左對齊)
    fillField(form, 'fill_11', 't_source_other', 8, TextAlignment.Left);
    fillField(form, 'fill_12', 't_risk_change', 8, TextAlignment.Left);

    // 3. 業務員建議區塊 (公司①強制加入前置空白)
    fillField(form, 'Text8', 't_rec_c1', 10, TextAlignment.Left, true); // 👈 啟動前置空白
    fillField(form, 'Text11', 't_rec_c2', 10, TextAlignment.Left);
    fillField(form, 'Text12', 't_rec_c3', 10, TextAlignment.Left);
    
    // 險種其他/保障範圍其他 (字體縮小為 8 + 靠左對齊)
    fillField(form, 'fill_13', 't_prod_other', 8, TextAlignment.Left);
    fillField(form, 'fill_14', 't_cov_other', 8, TextAlignment.Left);
    
    fillField(form, 'Text9', 't_rec_p1', 10, TextAlignment.Center);
    fillField(form, 'Text15', 't_rec_p2', 10, TextAlignment.Center);
    fillField(form, 'Text16', 't_rec_p3', 10, TextAlignment.Center);
    fillField(form, 'Text10', 't_rec_y1', 10, TextAlignment.Center);
    fillField(form, 'Text13', 't_rec_y2', 10, TextAlignment.Center);
    fillField(form, 'Text14', 't_rec_y3', 10, TextAlignment.Center);

    fillField(form, 'Text17', 't_date_y', 10, TextAlignment.Center);
    fillField(form, 'Text18', 't_date_m', 10, TextAlignment.Center);
    fillField(form, 'Text19', 't_date_d', 10, TextAlignment.Center);

    // ---------------------------------------------------------
    // ✅ 【打勾方塊對應區】(完美保留你手動校正的版本)
    // ---------------------------------------------------------
    
    // 1. 頂部報告書類別
    fillCheckbox(form, 'Check Box2', 'c_cat_life');
    fillCheckbox(form, 'Check Box3', 'c_cat_prop');
    fillCheckbox(form, 'Check Box4', 'c_cat_travel');

    // 🌟 2. 最容易錯位的性別 (被排在底層最後面的獨立 Check Box)
    fillCheckbox(form, 'Check Box25', 'c_app_m');
    fillCheckbox(form, 'Check Box26', 'c_app_f');
    fillCheckbox(form, 'Check Box27', 'c_ins_m');
    fillCheckbox(form, 'Check Box24', 'c_ins_f');

    // 3. 基本資料與關係
    fillCheckbox(form, 'toggle_4', 'c_same_app');
    fillCheckbox(form, 'toggle_5', 'c_rel_1');
    fillCheckbox(form, 'toggle_6', 'c_rel_2');
    fillCheckbox(form, 'toggle_7', 'c_rel_3');
    fillCheckbox(form, 'toggle_8', 'c_rel_4');
    fillCheckbox(form, 'toggle_9', 'c_rel_5');
    fillCheckbox(form, 'undefined', 'c_rel_6');

    // 4. 投保目的及需求
    fillCheckbox(form, 'toggle_11', 'c_need_1');
    fillCheckbox(form, 'toggle_12', 'c_need_2');
    fillCheckbox(form, 'toggle_13', 'c_need_3');
    fillCheckbox(form, 'toggle_14', 'c_need_4');
    fillCheckbox(form, 'toggle_15', 'c_need_5');
    fillCheckbox(form, 'toggle_16', 'c_need_6');
    fillCheckbox(form, 'toggle_17', 'c_need_7');
    fillCheckbox(form, 'toggle_18', 'c_need_8');
    fillCheckbox(form, 'undefined_2', 'c_need_9');

    // 5. 指定保險公司
    fillCheckbox(form, 'toggle_31', 'c_spec_no');
    fillCheckbox(form, 'undefined_3', 'c_spec_yes');

    // 6. 是否已有投保其他 (這兩個在 PDF 建立時順序被先拉了)
    fillCheckbox(form, 'toggle_33', 'c_has_other_yes');
    fillCheckbox(form, 'toggle_34', 'c_has_other_no');

    // 7. 欲投保險種
    fillCheckbox(form, 'toggle_20', 'c_type_1');
    fillCheckbox(form, 'toggle_21', 'c_type_2');
    fillCheckbox(form, 'toggle_22', 'c_type_3');
    fillCheckbox(form, 'toggle_23', 'c_type_4');
    fillCheckbox(form, 'toggle_24', 'c_type_5');
    fillCheckbox(form, 'toggle_25', 'c_type_6');
    fillCheckbox(form, 'toggle_26', 'c_type_7');
    fillCheckbox(form, 'toggle_27', 'c_type_8');
    fillCheckbox(form, 'toggle_28', 'c_type_9');
    fillCheckbox(form, 'toggle_29', 'c_type_10');
    fillCheckbox(form, 'toggle_30', 'c_type_11');

    // 8. 幣別
    fillCheckbox(form, 'toggle_381', 'c_cur_1');
    fillCheckbox(form, 'toggle_391', 'c_cur_2');
    fillCheckbox(form, 'toggle_401', 'c_cur_3');

    // 9. 繳費方式 
    fillCheckbox(form, 'toggle_35', 'c_pay_1');
    fillCheckbox(form, 'toggle_36', 'c_pay_2');
    fillCheckbox(form, 'toggle_37', 'c_pay_3');
    fillCheckbox(form, 'toggle_38', 'c_pay_4');
    fillCheckbox(form, 'toggle_39', 'c_pay_5');

    // 10. 剩餘年期 
    fillCheckbox(form, 'toggle_40', 'c_ret_1');
    fillCheckbox(form, 'toggle_41', 'c_ret_2');
    fillCheckbox(form, 'toggle_42', 'c_ret_3');
    fillCheckbox(form, 'toggle_43', 'c_ret_4');
    fillCheckbox(form, 'toggle_44', 'c_ret_5');
    fillCheckbox(form, 'toggle_45', 'c_ret_6');
    fillCheckbox(form, 'toggle_46', 'c_ret_7');

    // 11. 來源
    fillCheckbox(form, 'toggle_47', 'c_src_1');
    fillCheckbox(form, 'toggle_48', 'c_src_2');
    fillCheckbox(form, 'toggle_49', 'c_src_3');
    fillCheckbox(form, 'toggle_50', 'c_src_4');
    fillCheckbox(form, 'toggle_51', 'c_src_5');
    fillCheckbox(form, 'toggle_52', 'c_src_6');
    fillCheckbox(form, 'undefined_4', 'c_src_7');

    // 12. 高齡客戶
    fillCheckbox(form, 'toggle_54', 'c_old_app_y');
    fillCheckbox(form, 'toggle_55', 'c_old_app_n');
    fillCheckbox(form, 'toggle_56', 'c_old_ins_y');
    fillCheckbox(form, 'toggle_57', 'c_old_ins_n');
    fillCheckbox(form, 'toggle_58', 'c_old_auth_y');
    fillCheckbox(form, 'toggle_59', 'c_old_auth_n');

    // 13. 投資型與外幣
    fillCheckbox(form, 'toggle_60', 'c_inv_1');
    fillCheckbox(form, 'toggle_61', 'c_inv_2');
    fillCheckbox(form, 'toggle_62', 'c_inv_3');
    fillCheckbox(form, 'toggle_63', 'c_fx_y');
    fillCheckbox(form, 'toggle_64', 'c_fx_n');

    // 14. 業務員建議
    fillCheckbox(form, 'toggle_66', 'c_prov_1');
    fillCheckbox(form, 'toggle_67', 'c_prov_2');
    fillCheckbox(form, 'toggle_68', 'c_prod_1');
    fillCheckbox(form, 'toggle_69', 'c_prod_2');
    fillCheckbox(form, 'undefined_5', 'c_prod_3');
    fillCheckbox(form, 'toggle_71', 'c_term_1');
    fillCheckbox(form, 'toggle_72', 'c_cov_1');
    fillCheckbox(form, 'toggle_73', 'c_cov_2');
    fillCheckbox(form, 'undefined_6', 'c_cov_3');

    // 15. 建議理由
    fillCheckbox(form, 'toggle_75', 'c_rsn_1');
    fillCheckbox(form, 'toggle_76', 'c_rsn_2');
    fillCheckbox(form, 'toggle_77', 'c_rsn_3');
    fillCheckbox(form, 'toggle_78', 'c_rsn_4');
    fillCheckbox(form, 'toggle_79', 'c_rsn_5');

    // 新增：具投資或匯率風險應提供之風險說明
    fillCheckbox(form, 'toggle_65', 'c_risk_prov');
    
    // 洗錢防制檢核表 (精準校正版)
    fillCheckbox(form, 'toggle_80', 'c_aml_1'); // 地域風險 - 一般
    fillCheckbox(form, 'toggle_81', 'c_aml_2'); // 地域風險 - 高
    
    fillCheckbox(form, 'toggle_82', 'c_aml_3'); // 保戶風險 - 一般
    fillCheckbox(form, 'toggle_83', 'c_aml_4'); // 保戶風險 - 高
    
    fillCheckbox(form, 'toggle_84', 'c_aml_5'); // 產品風險 - 一般
    fillCheckbox(form, 'toggle_85', 'c_aml_6'); // 產品風險 - 高
    
    fillCheckbox(form, 'toggle_86', 'c_aml_7'); // 整體風險 - 一般
    fillCheckbox(form, 'toggle_87', 'c_aml_8'); // 整體風險 - 高
}

init();
