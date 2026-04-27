const { PDFDocument, TextAlignment, PDFName, StandardFonts } = PDFLib;

const pdfUrl = './書面分析報告輸入版.pdf';
const fontUrl = './NotoSansTC-Regular.ttf';

let originalPdfBytes = null;
let originalFontBytes = null;

// 🌟 解決延遲：新增一個計時器變數
let debounceTimer; 

// 🌟 加入第四個參數 targetFont
function fillField(form, fieldName, elementId, targetFont, fontSize = 10, align = null) {
    try {
        const field = form.getTextField(fieldName);
        const inputElement = document.getElementById(elementId);
        
        if (field && inputElement) {
            // 清除干擾機關
            field.removeMaxLength();
            if (typeof field.disableCombing === 'function') field.disableCombing();
            if (align !== null) field.setAlignment(align);

            // 寫入文字與設定大小
            field.setText(inputElement.value);
            if (fontSize !== null) field.setFontSize(fontSize); 

            // 👇 最關鍵：直接針對這個欄位更新字型與外觀
            field.updateAppearances(targetFont);
        }
    } catch (e) {
        // 忽略錯誤
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
    
    // 1. 載入中文字型 (給名字、公司用)
    const customFont = await pdfDoc.embedFont(originalFontBytes);
    // 2. 載入標準英文字型 (專門給身分證用，拯救排版！)
    const helveticaFont = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
    
    const form = pdfDoc.getForm();

    // 🌟 依照欄位特性，分配不同的字型給小幫手
    fillField(form, 'fill_16', 'applicantName', customFont);
    
    // 👇 身分證專屬：換上 helveticaFont，並且靠左對齊
    fillField(form, 'fill_17', 'applicantId', helveticaFont, 10, TextAlignment.Left);
    
    fillField(form, 'fill_18', 'applicantBirthday', customFont);
    fillField(form, 'fill_19', 'applicantOccupation', customFont);
    fillField(form, 'Text8', 'insuranceCompany', customFont);

    // ⚠️ 這裡原本有一行 form.updateFieldAppearances(customFont); 請務必刪除！
    // 因為我們已經在 fillField 裡面針對每個欄位單獨更新了，這樣才不會互相覆蓋。

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
