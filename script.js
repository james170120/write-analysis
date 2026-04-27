const { PDFDocument } = PDFLib;

const pdfUrl = './書面分析報告輸入版.pdf';
let originalPdfBytes = null;

// 💡 測試模式開關：
// 設為 true 時，會在 PDF 的每個文字框填入它的「欄位名稱」，方便你找對應關係。
// 找完之後，把它改成 false 就可以恢復正常的連動輸入功能。
const DEBUG_MODE = true; 

async function init() {
    try {
        const response = await fetch(pdfUrl);
        originalPdfBytes = await response.arrayBuffer();

        await updatePreview();

        // 監聽表單變動
        document.getElementById('pdfForm').addEventListener('input', updatePreview);
        document.getElementById('downloadBtn').addEventListener('click', downloadPDF);

    } catch (error) {
        console.error("載入 PDF 發生錯誤:", error);
    }
}

async function updatePreview() {
    if (!originalPdfBytes) return;

    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    if (DEBUG_MODE) {
        // 【測試模式】將每個文字欄位的名稱，直接填入該欄位中
        fields.forEach(field => {
            const name = field.getName();
            // 判斷是否為文字輸入框 (排除 CheckBox 等)
            if (field.constructor.name === 'PDFTextField') {
                try {
                    field.setText(name);
                } catch (e) {
                    console.warn(`無法寫入欄位: ${name}`);
                }
            }
        });
    } else {
        // 【正式模式】這裡是你未來要對應真實資料的地方
        try {
            // 👇 這裡請把 'fill_XX' 換成你透過測試模式找到的正確名稱
            const applicantField = form.getTextField('fill_16'); // 假設 fill_16 是要保人
            const applicantValue = document.getElementById('applicantName').value;
            if (applicantField) applicantField.setText(applicantValue);

            const companyField = form.getTextField('Text5'); // 假設 Text5 是保險公司
            const companyValue = document.getElementById('insuranceCompany').value;
            if (companyField) companyField.setText(companyValue);

        } catch (e) {
            console.error("填寫欄位時發生錯誤", e);
        }
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    document.getElementById('pdfPreview').src = url;
}

async function downloadPDF() {
    // 下載邏輯與 updatePreview 的正式模式相同，這裡先簡化
    if (!originalPdfBytes) return;
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const form = pdfDoc.getForm();

    try {
        const applicantField = form.getTextField('fill_16'); // 替換成正確名稱
        if (applicantField) applicantField.setText(document.getElementById('applicantName').value);
        
        form.flatten(); // 鎖死表單
    } catch(e) {}

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
