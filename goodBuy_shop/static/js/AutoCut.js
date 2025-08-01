function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + "=")) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.getElementById("auto-cut-upload").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("image", file);

  fetch("/shop/api/crop-image/", {
    method: "POST",
    body: formData,
    headers: { "X-CSRFToken": getCookie("csrftoken") }
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.images && data.images.length > 0) {
        data.images.forEach(imgPath => {
          addProductWithImage(imgPath);
        });
      } else {
        alert("圖片切割失敗");
      }
    });
});

function addProductWithImage(imgPath) {
  const area = document.getElementById("product-area");
  if (!area) return;

  const div = document.createElement("div");
  div.className = "card p-3 mb-3 position-relative";
  div.innerHTML = `
    <img src="/static/img/x.png" class="position-absolute end-0 top-0 m-2" role="button" onclick="this.parentElement.remove()" style="width:20px;height:20px;">
    <div class="mb-2">
      <label class="form-label">商品名稱</label>
      <input type="text" name="product_name[]" class="form-control" required>
    </div>
    <div class="mb-2">
      <label class="form-label">價格</label>
      <input type="number" name="product_price[]" class="form-control" required>
    </div>
    <div class="mb-2">
      <label class="form-label">數量</label>
      <input type="number" name="product_qty[]" class="form-control" required>
    </div>
    <div class="mb-2">
      <label class="form-label">商品圖片</label>
      <div class="image-preview mb-2">
        <img src="/upload/${imgPath}" style="width:100px;height:100px;object-fit:cover;">
      </div>
      <input type="hidden" name="product_image_name[]" value="${imgPath}">
    </div>
  `;
  simulateFileInputUpload(imgPath, div);
  area.appendChild(div);
}

function createFileList(file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  return dataTransfer.files;
}

function simulateFileInputUpload(imgPath, targetDiv) {
  fetch("/upload/cropped/" + imgPath)
    .then(res => res.blob())
    .then(blob => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.name = "product_image_" + document.querySelectorAll('[name^=product_image_]').length;
      fileInput.files = createFileList(new File([blob], imgPath, { type: blob.type }));
      fileInput.style.display = "none";
      targetDiv.appendChild(fileInput);
    });
}