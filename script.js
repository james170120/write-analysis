const { PDFDocument, TextAlignment, PDFName, StandardFonts } = PDFLib;
const DEBUG_MODE = true;
const pdfUrl = './書面分析報告輸入版.pdf';
const fontUrl = './NotoSansTC-Regular.ttf';

let originalPdfBytes = null;
let originalFontBytes = null;
let debounceTimer; 

// 🛡️ 終極文字專用小幫手 (自帶防呆、防散開、防多行Bug)
function fillField(form, fieldName, elementId, targetFont, fontSize = 10, align = null) {
    try {
        const field = form.getTextField(fieldName);
        const inputElement = document.getElementById(elementId);
        
        if (field && inputElement) {
            field.removeMaxLength();
            if (typeof field.disableCombing === 'function') field.disableCombing();
            field.disableMultiline();

            if (align !== null) field.setAlignment(align);

            // 隱形空白防呆法
            let finalValue = inputElement.value;
            if (finalValue !== '') finalValue = finalValue + ' '; 
            
            field.setText(finalValue);
            if (fontSize !== null) field.setFontSize(fontSize); 
            field.updateAppearances(targetFont);
        }
    } catch (e) {}
}

// ✅ 打勾方塊專用小幫手
function fillCheckbox(form, fieldName, elementId) {
    try {
        const field = form.getCheckBox(fieldName);
        const inputElement = document.getElementById(elementId);
        
        if (field && inputElement) {
            if (inputElement.checked) {
                field.check();
            } else {
                field.uncheck();
            }
        }
    } catch (e) {}
}

async function init() {
    try {
        const [pdfResponse, fontResponse] = await Promise.all([
            fetch(pdfUrl), fetch(fontUrl)
        ]);
        originalPdfBytes = await pdfResponse.arrayBuffer();
        originalFontBytes = await fontResponse.arrayBuffer();
        await updatePreview();

        document.getElementById('pdfForm').addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updatePreview, 600); 
        });
        document.getElementById('downloadBtn').addEventListener('click', downloadPDF);
    } catch (error) {
        console.error("載入發生錯誤:", error);
    }
}

async function updatePreview() {
    if (!originalPdfBytes || !originalFontBytes) return;

    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    pdfDoc.registerFontkit(window.fontkit);
    
    // 載入字型
    const customFont = await pdfDoc.embedFont(originalFontBytes);
    const helveticaFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    if (DEBUG_MODE) {
        console.log("=== 你的 PDF 欄位名稱列表 ===");
        fields.forEach(field => {
            const name = field.getName();
            console.log(name); // 同時會在 F12 的 Console 印出清單

            try {
                // 1. 如果是文字框，就把名稱印在格子裡
                const textField = form.getTextField(name);
                textField.setText(name);
                textField.setFontSize(8); // 字縮小一點才塞得下名稱
            } catch (e) {
                // 2. 如果是打勾方塊，我們讓它自動打勾，方便你在圖上對應位置
                try {
                    const checkBox = form.getCheckBox(name);
                    checkBox.check();
                } catch (err) {}
            }
        });
    } else {
        // 這裡放你原本寫好的正式填寫邏輯 (fillField 等等)
        fillField(form, 'fill_16', 'applicantName', customFont);
        fillField(form, 'fill_17', 'applicantId', helveticaFont, 10, TextAlignment.Left);
        // ... 以此類推
    }

    // 更新外觀並顯示
    form.updateFieldAppearances(customFont);
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    document.getElementById('pdfPreview').src = url;
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

// 📦 將所有資料填入的邏輯集中在這裡，方便預覽與下載共同呼叫
function applyFormData(form, customFont, helveticaFont) {
    // ---------------------------------------------------------
    // 📝 【文字欄位對應區】(依照你提供的截圖對應)
    // ---------------------------------------------------------
    // 1. 基本資料
    fillField(form, 'fill_16', 'app_name', customFont);
    fillField(form, 'fill_17', 'app_id', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_18', 'app_birth', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_19', 'app_job', customFont);
    
    fillField(form, 'fill_20', 'ins_name', customFont);
    fillField(form, 'fill_21', 'ins_id', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_22', 'ins_birth', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_23', 'ins_job', customFont);
    
    fillField(form, 'fill_24', 'vehicle_plate', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_25', 'vehicle_type', customFont);
    fillField(form, 'fill_1', 'relation_other', customFont); // 關係其他/建議其他

    // 2. 需求與金額
    fillField(form, 'fill_2', 'need_other', customFont);
    fillField(form, 'fill_3', 'specify_company', customFont);
    fillField(form, 'Text5', 'amt_1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text7', 'unit_1', customFont, 10, TextAlignment.Center); // 圖上中間是 Text7
    fillField(form, 'Text6', 'amt_2', helveticaFont, 10, TextAlignment.Center);
    
    fillField(form, 'fill_4', 'period_y1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'fill_5', 'period_m1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'fill_6', 'period_d1', helveticaFont, 10, TextAlignment.Center);

    // 3. 保費與雜項
    fillField(form, 'fill_10', 'premium_amt', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'fill_11', 'source_other', customFont);
    fillField(form, 'fill_12', 'risk_other', customFont);

    // 4. 業務員建議
    fillField(form, 'Text8', 'rec_comp_1', customFont);
    fillField(form, 'Text11', 'rec_comp_2', customFont);
    fillField(form, 'Text12', 'rec_comp_3', customFont);
    fillField(form, 'fill_13', 'rec_prod_other', customFont);
    fillField(form, 'Text9', 'rec_prem_1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text15', 'rec_prem_2', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text16', 'rec_prem_3', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text10', 'rec_year_1', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text13', 'rec_year_2', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text14', 'rec_year_3', helveticaFont, 10, TextAlignment.Center);

    // 5. 日期
    fillField(form, 'Text17', 'date_y', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text18', 'date_m', helveticaFont, 10, TextAlignment.Center);
    fillField(form, 'Text19', 'date_d', helveticaFont, 10, TextAlignment.Center);

    // ---------------------------------------------------------
    // ✅ 【打勾方塊對應區】(依照 Console 順序邏輯推算)
    // ---------------------------------------------------------
    // 頂部報告書類別 (通常在清單最後或最前，這裡使用常見命名推斷)
    fillCheckbox(form, 'Check Box2', 'chk_cat1'); 
    fillCheckbox(form, 'Check Box3', 'chk_cat2');
    fillCheckbox(form, 'Check Box4', 'chk_cat3');

    // 性別與同要保人
    fillCheckbox(form, 'toggle_4', 'chk_app_m');
    fillCheckbox(form, 'toggle_5', 'chk_app_f');
    fillCheckbox(form, 'toggle_6', 'chk_same_app');
    fillCheckbox(form, 'toggle_7', 'chk_ins_m');
    fillCheckbox(form, 'toggle_8', 'chk_ins_f');

    // 投保目的及需求
    fillCheckbox(form, 'toggle_20', 'chk_need1'); // 保障需求
    fillCheckbox(form, 'toggle_21', 'chk_need2'); // 醫療給付
    fillCheckbox(form, 'toggle_22', 'chk_need3'); // 退休規劃
    fillCheckbox(form, 'toggle_23', 'chk_need4'); // 損害填補
    fillCheckbox(form, 'toggle_24', 'chk_need5'); // 法令要求
    fillCheckbox(form, 'toggle_25', 'chk_need6'); // 風險移轉

    // 投保險種
    fillCheckbox(form, 'toggle_26', 'chk_type1'); // 壽險
    fillCheckbox(form, 'toggle_27', 'chk_type2'); // 健康險
    fillCheckbox(form, 'toggle_28', 'chk_type3'); // 傷害險
    fillCheckbox(form, 'toggle_29', 'chk_type4'); // 失扶
    fillCheckbox(form, 'toggle_30', 'chk_type5'); // 年金
    fillCheckbox(form, 'toggle_31', 'chk_type6'); // 投資型
}

init();
