const { PDFDocument } = PDFLib;

// 設定你的 PDF 檔案路徑 (需與 HTML 同資料夾)
const pdfUrl = './書面分析報告輸入版.pdf';
let originalPdfBytes = null;

async function init() {
    try {
        // 1. 抓取原始 PDF 檔案
        const response = await fetch(pdfUrl);
        originalPdfBytes = await response.arrayBuffer();

        // 💡 輔助功能：開發階段用來確認 PDF 欄位名稱
        const pdfDoc = await PDFDocument.load(originalPdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();
        console.log("=== 你的 PDF 欄位名稱列表 ===");
        fields.forEach(field => console.log(field.getName()));
        console.log("============================");

        // 2. 載入初始預覽
        await updatePreview();

        // 3. 監聽表單變動，只要打字就會觸發更新
        document.getElementById('pdfForm').addEventListener('input', updatePreview);

        // 4. 設定下載按鈕
        document.getElementById('downloadBtn').addEventListener('click', downloadPDF);

    } catch (error) {
        console.error("載入 PDF 發生錯誤，請確認路徑或是否在伺服器環境下執行", error);
    }
}

async function updatePreview() {
    if (!originalPdfBytes) return;

    // 載入 PDF 複本以進行編輯
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const form = pdfDoc.getForm();

    try {
        // ⚠️ 這裡的 'Text1' 等字串，必須換成你 PDF 裡面真正的欄位名稱
        // 請打開瀏覽器開發者工具 (F12) 的 Console 查看剛才印出的名稱列表
        
        // 範例：填寫要保人姓名
        const applicantField = form.getTextField('填寫你的PDF要保人欄位名稱'); 
        const applicantValue = document.getElementById('applicantName').value;
        if (applicantField) applicantField.setText(applicantValue);

        // 範例：填寫保險公司
        const companyField = form.getTextField('填寫你的PDF保險公司欄位名稱'); 
        const companyValue = document.getElementById('insuranceCompany').value;
        if (companyField) companyField.setText(companyValue);

    } catch (e) {
        // 忽略找不到欄位的錯誤，不影響執行
    }

    // 產生 Blob 網址並顯示在 iframe
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    document.getElementById('pdfPreview').src = url;
}

async function downloadPDF() {
    if (!originalPdfBytes) return;
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const form = pdfDoc.getForm();

    // 下載前執行相同的填入邏輯 (建議未來可以把填寫邏輯抽成獨立函式)
    try {
        const applicantField = form.getTextField('填寫你的PDF要保人欄位名稱'); 
        if (applicantField) applicantField.setText(document.getElementById('applicantName').value);

        const companyField = form.getTextField('填寫你的PDF保險公司欄位名稱'); 
        if (companyField) companyField.setText(document.getElementById('insuranceCompany').value);

        // 可選：把表單鎖死，讓下載後的 PDF 無法再被修改
        form.flatten();
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

// 執行初始化
init();