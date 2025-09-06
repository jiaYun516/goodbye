// 暫時空的 JS，留作未來擴充，例如預覽上傳憑證
document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.querySelector('input[type="file"]');
    if(fileInput) {
        fileInput.addEventListener('change', function() {
            console.log('選擇了檔案:', fileInput.files);
        });
    }
});
