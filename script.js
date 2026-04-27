const { PDFDocument, TextAlignment, PDFName, StandardFonts } = PDFLib;

const pdfUrl = './書面分析報告輸入版.pdf';
const fontUrl = './NotoSansTC-Regular.ttf';

let originalPdfBytes = null;
let originalFontBytes = null;
let debounceTimer; 

// 🛡️ 防呆文字小幫手
function fillField(form, fieldName, elementId, targetFont, fontSize = 10, align = null) {
    try {
        const field = form.getTextField(fieldName);
        const inputElement = document.getElementById(elementId);
        
        if (field && inputElement) {
            field.removeMaxLength();
            if (typeof field.disableCombing === 'function') field.disableCombing();
            field.disableMultiline();

            if (align !== null) field.setAlignment(align);

            let finalValue = inputElement.value;
            if (finalValue !== '') finalValue = finalValue + ' '; // 空白防呆
            
            field.setText(finalValue);
            if (fontSize !== null) field.setFontSize(fontSize); 
            field.updateAppearances(targetFont);
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
    const helveticaFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    applyFormData(form, customFont, helveticaFont);

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    document.getElementById('pdfPreview').src = URL.createObjectURL(blob);
}

async function downloadPDF() {
    if (!originalPdfBytes || !originalFontBytes) return;
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    pdfDoc.registerFontkit(window.fontkit);
    
    const customFont = await pdfDoc.embedFont(originalFontBytes);
    const helveticaFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    applyFormData(form, customFont, helveticaFont);
    
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
function applyFormData(form, customFont, helveticaFont) {
    // ------------------- 【文字輸入區】 -------------------
    fillField(form, 'fill_16', 't_app_name', customFont);
    fillField(form, 'fill_17', 't_app_id', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_18', 't_app_birth', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_19', 't_app_job', customFont);
    
    fillField(form, 'fill_20', 't_ins_name', customFont);
    fillField(form, 'fill_21', 't_ins_id', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_22', 't_ins_birth', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_23', 't_ins_job', customFont);
    
    fillField(form, 'fill_24', 't_car_plate', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_25', 't_car_type', customFont);
    
    fillField(form, 'fill_1', 't_rel_other', customFont); // 關係/幣別 其他
    fillField(form, 'fill_2', 't_need_other', customFont); // 需求其他/風險備註 (共用)
    fillField(form, 'fill_3', 't_spec_company', customFont);
    
    fillField(form, 'Text5', 't_amt_1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text7', 't_amt_2', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text6', 't_amt_3', helveticaFont, 10, TextAlignment.Center);
    
    fillField(form, 'fill_4', 't_y1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'fill_5', 't_m1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'fill_6', 't_d1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'fill_7', 't_y2', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'fill_8', 't_m2', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'fill_9', 't_d2', helveticaFont, 10, TextAlignment.Center);

    fillField(form, 'fill_10', 't_premium_amt', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'fill_11', 't_source_other', customFont);
    fillField(form, 'fill_12', 't_risk_change', customFont);

    fillField(form, 'Text8', 't_rec_c1', customFont);
    fillField(form, 'Text11', 't_rec_c2', customFont);
    fillField(form, 'Text12', 't_rec_c3', customFont);
    fillField(form, 'fill_13', 't_prod_other', customFont);
    fillField(form, 'fill_14', 't_cov_other', customFont);
    
    fillField(form, 'Text9', 't_rec_p1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text15', 't_rec_p2', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text16', 't_rec_p3', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text10', 't_rec_y1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text13', 't_rec_y2', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text14', 't_rec_y3', helveticaFont, 10, TextAlignment.Center);

    fillField(form, 'Text17', 't_date_y', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text18', 't_date_m', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text19', 't_date_d', helveticaFont, 10, TextAlignment.Center);

    // ---------------------------------------------------------
    // ✅ 【打勾方塊對應區】(完美校正版)
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
    fillCheckbox(form, 'toggle_11', 'c_rel_6');

    // 4. 投保目的及需求
    fillCheckbox(form, 'toggle_12', 'c_need_1');
    fillCheckbox(form, 'toggle_13', 'c_need_2');
    fillCheckbox(form, 'toggle_14', 'c_need_3');
    fillCheckbox(form, 'toggle_15', 'c_need_4');
    fillCheckbox(form, 'toggle_16', 'c_need_5');
    fillCheckbox(form, 'toggle_20', 'c_need_6');
    fillCheckbox(form, 'toggle_21', 'c_need_7');
    fillCheckbox(form, 'toggle_22', 'c_need_8');
    fillCheckbox(form, 'toggle_23', 'c_need_9');

    // 5. 指定保險公司
    fillCheckbox(form, 'toggle_24', 'c_spec_no');
    fillCheckbox(form, 'toggle_25', 'c_spec_yes');

    // 6. 是否已有投保其他 (這兩個在 PDF 建立時順序被先拉了)
    fillCheckbox(form, 'toggle_17', 'c_has_other_yes');
    fillCheckbox(form, 'toggle_18', 'c_has_other_no');

    // 7. 欲投保險種
    fillCheckbox(form, 'toggle_26', 'c_type_1');
    fillCheckbox(form, 'toggle_27', 'c_type_2');
    fillCheckbox(form, 'toggle_28', 'c_type_3');
    fillCheckbox(form, 'toggle_29', 'c_type_4');
    fillCheckbox(form, 'toggle_30', 'c_type_5');
    fillCheckbox(form, 'toggle_31', 'c_type_6');
    fillCheckbox(form, 'toggle_33', 'c_type_7');
    fillCheckbox(form, 'toggle_34', 'c_type_8');
    fillCheckbox(form, 'toggle_35', 'c_type_9');
    fillCheckbox(form, 'toggle_36', 'c_type_10');
    fillCheckbox(form, 'toggle_37', 'c_type_11');

    // 8. 幣別
    fillCheckbox(form, 'toggle_38', 'c_cur_1');
    fillCheckbox(form, 'toggle_39', 'c_cur_2');
    fillCheckbox(form, 'toggle_40', 'c_cur_3');

    // 9. 繳費方式 (直行跳號規律 42, 44...)
    fillCheckbox(form, 'toggle_42', 'c_pay_1');
    fillCheckbox(form, 'toggle_44', 'c_pay_2');
    fillCheckbox(form, 'toggle_46', 'c_pay_3');
    fillCheckbox(form, 'toggle_48', 'c_pay_4');
    fillCheckbox(form, 'toggle_50', 'c_pay_5');

    // 10. 剩餘年期 (直行跳號規律 41, 43...)
    fillCheckbox(form, 'toggle_41', 'c_ret_1');
    fillCheckbox(form, 'toggle_43', 'c_ret_2');
    fillCheckbox(form, 'toggle_45', 'c_ret_3');
    fillCheckbox(form, 'toggle_47', 'c_ret_4');
    fillCheckbox(form, 'toggle_49', 'c_ret_5');
    fillCheckbox(form, 'toggle_51', 'c_ret_6');
    fillCheckbox(form, 'toggle_52', 'c_ret_7');

    // 11. 來源
    fillCheckbox(form, 'toggle_54', 'c_src_1');
    fillCheckbox(form, 'toggle_55', 'c_src_2');
    fillCheckbox(form, 'toggle_56', 'c_src_3');
    fillCheckbox(form, 'toggle_57', 'c_src_4');
    fillCheckbox(form, 'toggle_58', 'c_src_5');
    fillCheckbox(form, 'toggle_59', 'c_src_6');
    fillCheckbox(form, 'toggle_60', 'c_src_7');

    // 12. 高齡客戶
    fillCheckbox(form, 'toggle_61', 'c_old_app_y');
    fillCheckbox(form, 'toggle_62', 'c_old_app_n');
    fillCheckbox(form, 'toggle_63', 'c_old_ins_y');
    fillCheckbox(form, 'toggle_64', 'c_old_ins_n');
    fillCheckbox(form, 'toggle_65', 'c_old_auth_y');
    fillCheckbox(form, 'toggle_66', 'c_old_auth_n');

    // 13. 投資型與外幣
    fillCheckbox(form, 'toggle_67', 'c_inv_1');
    fillCheckbox(form, 'toggle_68', 'c_inv_2');
    fillCheckbox(form, 'toggle_69', 'c_inv_3');
    fillCheckbox(form, 'toggle_71', 'c_fx_y');
    fillCheckbox(form, 'toggle_72', 'c_fx_n');

    // 14. 業務員建議
    fillCheckbox(form, 'toggle_75', 'c_prov_1');
    fillCheckbox(form, 'toggle_76', 'c_prov_2');
    fillCheckbox(form, 'toggle_77', 'c_prod_1');
    fillCheckbox(form, 'toggle_78', 'c_prod_2');
    fillCheckbox(form, 'toggle_79', 'c_prod_3');
    fillCheckbox(form, 'toggle_80', 'c_term_1');
    fillCheckbox(form, 'toggle_81', 'c_cov_1');
    fillCheckbox(form, 'toggle_82', 'c_cov_2');
    fillCheckbox(form, 'toggle_83', 'c_cov_3');

    // 15. 建議理由
    fillCheckbox(form, 'toggle_84', 'c_rsn_1');
    fillCheckbox(form, 'toggle_85', 'c_rsn_2');
    fillCheckbox(form, 'toggle_86', 'c_rsn_3');
    fillCheckbox(form, 'toggle_87', 'c_rsn_4');
    
    // ⚠️ 備註：洗錢防制檢核表 & 理由的「其他」在 PDF 原始檔中並未建立對應的 Checkbox 欄位。
}

init();
