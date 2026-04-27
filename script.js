const { PDFDocument, TextAlignment, PDFName, StandardFonts } = PDFLib;
const DEBUG_MODE = true;
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
