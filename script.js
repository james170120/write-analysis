const { PDFDocument, TextAlignment, PDFName, StandardFonts } = PDFLib;

const pdfUrl = './書面分析報告輸入版.pdf';
const fontUrl = './NotoSansTC-Regular.ttf';

let originalPdfBytes = null;
let originalFontBytes = null;
let debounceTimer; 

// 📝 文字專用小幫手 (保留我們的終極防呆版)
function fillField(form, fieldName, elementId, targetFont, fontSize = 10, align = null) {
    try {
        const field = form.getTextField(fieldName);
        const inputElement = document.getElementById(elementId);
        
        if (field && inputElement) {
            field.removeMaxLength();
            if (typeof field.disableCombing === 'function') field.disableCombing();
            if (align !== null) field.setAlignment(align);

            field.setText(inputElement.value);
            if (fontSize !== null) field.setFontSize(fontSize); 
            field.updateAppearances(targetFont);
        }
    } catch (e) {}
}

// ✅ 全新！打勾方塊專用小幫手
function fillCheckbox(form, fieldName, elementId) {
    try {
        const field = form.getCheckBox(fieldName);
        const inputElement = document.getElementById(elementId);
        
        if (field && inputElement) {
            if (inputElement.checked) {
                field.check(); // 打勾
            } else {
                field.uncheck(); // 取消打勾
            }
        }
    } catch (e) {
        // 如果 PDF 裡面的名稱對不上，或是它其實是 RadioButton，會在這裡被忽略
    }
}

async function init() {
    try {
        const [pdfResponse, fontResponse] = await Promise.all([
            fetch(pdfUrl),
            fetch(fontUrl)
        ]);
        
        originalPdfBytes = await pdfResponse.arrayBuffer();
        originalFontBytes = await fontResponse.arrayBuffer();

        await updatePreview();

        document.getElementById('pdfForm').addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(updatePreview, 500); 
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
    
    const customFont = await pdfDoc.embedFont(originalFontBytes);
    const helveticaFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    // ==========================================
    // 📝 填寫文字欄位
    // ==========================================
    // 要保人
    fillField(form, 'fill_16', 'applicantName', customFont);
    fillField(form, 'fill_17', 'applicantId', helveticaFont, 10, TextAlignment.Left);
    fillField(form, 'fill_18', 'applicantBirthday', customFont);
    fillField(form, 'fill_19', 'applicantOccupation', customFont);
    
    // 被保人 (請把 fill_XX 換成你找出的正確名稱)
    fillField(form, 'fill_20', 'insuredName', customFont); 
    fillField(form, 'fill_21', 'insuredId', helveticaFont, 10, TextAlignment.Left);

    fillField(form, 'Text8', 'insuranceCompany', customFont);

    // ==========================================
    // ✅ 填寫打勾方塊 (Checkbox)
    // ==========================================
    // 👇 請把 'toggle_XX' 換成你在開發者工具或 PDF 編輯器中找到的真實名稱！
    
    // 性別範例
    fillCheckbox(form, 'toggle_4', 'appGenderMale');
    fillCheckbox(form, 'toggle_5', 'appGenderFemale');

    // 同要保人範例
    fillCheckbox(form, 'toggle_6', 'sameAsApplicant');

    // 投保目的範例
    fillCheckbox(form, 'toggle_7', 'purpose1'); // 保障需求
    fillCheckbox(form, 'toggle_8', 'purpose2'); // 醫療給付
    fillCheckbox(form, 'toggle_9', 'purpose3'); // 退休規劃

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    document.getElementById('pdfPreview').src = url;
}

// (為了版面簡潔，downloadPDF 的內容請比照 updatePreview 內的 fillField 與 fillCheckbox 補上，並加上 form.flatten(); 即可)
async function downloadPDF() {
    // ... 前置作業相同 ...
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    pdfDoc.registerFontkit(window.fontkit);
    const customFont = await pdfDoc.embedFont(originalFontBytes);
    const helveticaFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    // 複製 updatePreview 裡的 fillField 跟 fillCheckbox 到這裡
    fillField(form, 'fill_16', 'applicantName', customFont);
    fillField(form, 'fill_17', 'applicantId', helveticaFont, 10, TextAlignment.Left);
    fillCheckbox(form, 'toggle_4', 'appGenderMale');
    // ... 依此類推 ...

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

init();
