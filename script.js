const { PDFDocument } = PDFLib;

const pdfUrl = './書面分析報告輸入版.pdf';
const fontUrl = './NotoSansTC-VariableFont_wght.ttf';

let originalPdfBytes = null;
let originalFontBytes = null;

// 🌟 解決延遲：新增一個計時器變數
let debounceTimer; 

// 🌟 更新小幫手：加入 fontSize 參數，預設為 10
function fillField(form, fieldName, elementId, fontSize = 10) {
    try {
        const field = form.getTextField(fieldName);
        const inputElement = document.getElementById(elementId);
        
        if (field && inputElement) {
            field.setText(inputElement.value);
            // 如果 fontSize 有給定數值，才強制設定大小；如果設為 null 則讓 PDF 自動判斷
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
    fillField(form, 'fill_17', 'applicantId', 8);
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
    fillField(form, 'fill_17', 'applicantId');
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
