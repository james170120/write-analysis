const { PDFDocument } = PDFLib;

const pdfUrl = './書面分析報告輸入版.pdf';
let originalPdfBytes = null;

// 💡 測試模式開關：
// 設為 true 時，會在 PDF 的每個文字框填入它的「欄位名稱」，方便你找對應關係。const { PDFDocument } = PDFLib;

const pdfUrl = './書面分析報告輸入版.pdf';
// 👇 新增字型檔案的路徑 (請確認檔名與你資料夾中的一致)
const fontUrl = './NotoSansTC-VariableFont_wght.ttf';

let originalPdfBytes = null;
let originalFontBytes = null; // 用來儲存字型資料

const DEBUG_MODE = false; 

async function init() {
    try {
        // 同時抓取 PDF 檔案與字型檔案
        const [pdfResponse, fontResponse] = await Promise.all([
            fetch(pdfUrl),
            fetch(fontUrl)
        ]);
        
        originalPdfBytes = await pdfResponse.arrayBuffer();
        originalFontBytes = await fontResponse.arrayBuffer(); // 取得字型位元組

        await updatePreview();

        document.getElementById('pdfForm').addEventListener('input', updatePreview);
        document.getElementById('downloadBtn').addEventListener('click', downloadPDF);

    } catch (error) {
        console.error("載入發生錯誤，請確認 PDF 與字型檔是否都在同一個資料夾:", error);
    }
}

async function updatePreview() {
    if (!originalPdfBytes || !originalFontBytes) return;

    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    
    // 👇 註冊 fontkit 並嵌入我們的中文字型
    pdfDoc.registerFontkit(window.fontkit);
    const customFont = await pdfDoc.embedFont(originalFontBytes);

    const form = pdfDoc.getForm();

    try {
        const applicantField = form.getTextField('fill_16');
        if (applicantField) applicantField.setText(document.getElementById('applicantName').value);

        const idField = form.getTextField('fill_17');
        if (idField) idField.setText(document.getElementById('applicantId').value);

        const birthdayField = form.getTextField('fill_18');
        if (birthdayField) birthdayField.setText(document.getElementById('applicantBirthday').value);

        const occupationField = form.getTextField('fill_19');
        if (occupationField) occupationField.setText(document.getElementById('applicantOccupation').value);

        const companyField = form.getTextField('Text8');
        if (companyField) companyField.setText(document.getElementById('insuranceCompany').value);

        // 🌟 最關鍵的一步：將整個表單的字體外觀更新為我們的中文字體
        form.updateFieldAppearances(customFont);

    } catch (e) {
        console.error("填寫欄位時發生錯誤", e);
    }

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

    try {
        // 下載前執行相同的填入邏輯
        const applicantField = form.getTextField('fill_16');
        if (applicantField) applicantField.setText(document.getElementById('applicantName').value);

        const idField = form.getTextField('fill_17');
        if (idField) idField.setText(document.getElementById('applicantId').value);

        const birthdayField = form.getTextField('fill_18');
        if (birthdayField) birthdayField.setText(document.getElementById('applicantBirthday').value);

        const occupationField = form.getTextField('fill_19');
        if (occupationField) occupationField.setText(document.getElementById('applicantOccupation').value);

        const companyField = form.getTextField('Text8');
        if (companyField) companyField.setText(document.getElementById('insuranceCompany').value);

        // 更新字體並將表單鎖死
        form.updateFieldAppearances(customFont);
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

init();
// 💡 將這裡改成 false，關閉測試模式，恢復正常預覽
const DEBUG_MODE = false;

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
            try {
                // 直接嘗試將它當作文字欄位來操作
                // 如果它剛好是打勾方塊或其他欄位，這行會報錯並被下方的 catch 捕捉忽略
                const textField = form.getTextField(name);
                textField.setText(name);
                // 可以把字體稍微設小一點，避免名稱太長塞不進格子裡
                textField.setFontSize(10); 
            } catch (e) {
                // 忽略非文字欄位
            }
        });
    } else {
        // 【正式模式】
        try {
            // 要保人姓名 (fill_16)
            const applicantField = form.getTextField('fill_16');
            if (applicantField) applicantField.setText(document.getElementById('applicantName').value);

            // 身分證字號 (fill_17)
            const idField = form.getTextField('fill_17');
            if (idField) idField.setText(document.getElementById('applicantId').value);

            // 生日 (fill_18)
            const birthdayField = form.getTextField('fill_18');
            if (birthdayField) birthdayField.setText(document.getElementById('applicantBirthday').value);

            // 職業 (fill_19)
            const occupationField = form.getTextField('fill_19');
            if (occupationField) occupationField.setText(document.getElementById('applicantOccupation').value);

            // 保險公司名稱① (Text8)
            const companyField = form.getTextField('Text8');
            if (companyField) companyField.setText(document.getElementById('insuranceCompany').value);

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
