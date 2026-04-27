const { PDFDocument, TextAlignment, PDFName } = PDFLib;

const pdfUrl = './書面分析報告輸入版.pdf';
const fontUrl = './NotoSansTC-Regular.ttf';

let originalPdfBytes = null;
let originalFontBytes = null;

// 🌟 解決延遲：新增一個計時器變數
let debounceTimer; 

function fillField(form, fieldName, elementId, fontSize = 10, align = null) {
    try {
        const field = form.getTextField(fieldName);
        const inputElement = document.getElementById(elementId);
        
        if (field && inputElement) {
            // ☢️ 核彈級清除魔法：直接把 PDF 底層的「所有」隱藏規則全部抹除
            field.acroField.dict.delete(PDFName.of('MaxLen')); // 刪除最大字數限制
            field.acroField.dict.delete(PDFName.of('Ff'));     // 刪除所有欄位旗標 (徹底消滅梳理、自動排版等隱藏機制)
            field.acroField.dict.delete(PDFName.of('Q'));      // 刪除舊的對齊規則

            // 重新賦予我們要的對齊方向 (因為前面被刪掉了，所以這裡重新建立)
            if (align !== null) {
                field.setAlignment(align);
            }

            // 填寫文字
            field.setText(inputElement.value);

            // 設定字體大小
            if (fontSize !== null) {
                field.setFontSize(fontSize); 
            }
        }
    } catch (e) {
        // 忽略找不到欄位的錯誤
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

        // 🌟 解決延遲：改用「防抖 (Debounce)」機制來監聽輸入
        document.getElementById('pdfForm').addEventListener('input', () => {
            clearTimeout(debounceTimer); // 如果你還在連續打字，就取消上一次的倒數
            debounceTimer = setTimeout(updatePreview, 500); // 等你停下手 0.5 秒後，才更新 PDF
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
    const form = pdfDoc.getForm();

    // 🌟 使用小幫手函式，程式碼變得超級乾淨！未來新增欄位只要複製貼上一行即可
    fillField(form, 'fill_16', 'applicantName');
    // 👇 第五個參數加上 TextAlignment.Right，強制靠右對齊！
    fillField(form, 'fill_17', 'applicantId', 8, TextAlignment.Left);
    fillField(form, 'fill_18', 'applicantBirthday');
    fillField(form, 'fill_19', 'applicantOccupation');
    fillField(form, 'Text8', 'insuranceCompany');

    // 套用中文字型
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
    const form = pdfDoc.getForm();

    // 下載時也一樣套用乾淨的寫法
    fillField(form, 'fill_16', 'applicantName');
    fillField(form, 'fill_17', 'applicantId', 10, TextAlignment.Left);
    fillField(form, 'fill_18', 'applicantBirthday');
    fillField(form, 'fill_19', 'applicantOccupation');
    fillField(form, 'Text8', 'insuranceCompany');

    form.updateFieldAppearances(customFont);
    
    // 鎖死表單，讓下載後的 PDF 無法再被編輯
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
