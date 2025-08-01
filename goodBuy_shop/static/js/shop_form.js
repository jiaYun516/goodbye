// 根據 header 高度調整內容區距
window.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector('.header');
  const content = document.querySelector('.main-content');
  if (header && content) {
    content.style.marginTop = header.offsetHeight + 'px';
  }
});

// 動態新增商品欄位
let productIndex = document.querySelectorAll('#product-area .card').length || 0;

function addProduct() {
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
      <label class="form-label">商品圖片（可更換）</label>
      <div class="image-preview mb-2"></div>
      <input type="file" name="product_image_${productIndex}" class="form-control product-img-input" accept="image/*">
    </div>
  `;
  area.appendChild(div);

  const fileInput = div.querySelector('.product-img-input');
  const previewDiv = div.querySelector('.image-preview');
  fileInput.addEventListener('change', function () {
    previewDiv.innerHTML = '';
    if (this.files && this.files[0]) {
      const url = URL.createObjectURL(this.files[0]);
      previewDiv.innerHTML = `<img src="${url}" style="width:100px;height:100px;object-fit:cover;">`;
    }
  });

  productIndex += 1;
}

// 切換「開始時間」顯示（僅限現貨）
const shopStateField = document.querySelector('[name="shop_state"]');
const startTimeGroup = document.getElementById("start-time-group");
if (shopStateField && startTimeGroup) {
  const toggleStartTime = () => {
    startTimeGroup.style.display = shopStateField.value.includes("現貨") ? "block" : "none";
  };
  shopStateField.addEventListener("change", toggleStartTime);
  toggleStartTime();
}

// 圖片預覽與封面選取
const uploadBox = document.getElementById('image-upload-box');
const uploadInput = document.getElementById('image-upload-box-input');
const mainImagePreview = document.getElementById('main-image-preview');
const imagePreviewArea = document.getElementById('image-preview-area');
const coverIndexInput = document.querySelector('input[name="cover_index"]');
const imageOrderInput = document.querySelector('input[name="image_order"]');

if (uploadBox && uploadInput) {
  uploadBox.addEventListener('click', function (e) {
    // 避免點擊小圖時也觸發
    if (
      e.target === uploadBox ||
      e.target.classList.contains('main-image-placeholder') ||
      e.target.id === 'main-image-preview' ||
      mainImagePreview.contains(e.target)
    ) {
      uploadInput.click();
    }
  });
}

function updateImagePreviews(selectedCoverIdx = 0) {
  const files = Array.from(uploadInput.files);
  imagePreviewArea.innerHTML = '';
  mainImagePreview.innerHTML = '';

  if (files.length === 0) {
    mainImagePreview.innerHTML = '<span class="main-image-placeholder text-secondary">＋ 新增圖片</span>';
    if (coverIndexInput) coverIndexInput.value = '';
    if (imageOrderInput) imageOrderInput.value = '';
    return;
  }

  // 主圖（封面）
  let coverIdx = Number(selectedCoverIdx);
  if (isNaN(coverIdx) || coverIdx < 0 || coverIdx >= files.length) coverIdx = 0;
  const coverFile = files[coverIdx];
  const coverReader = new FileReader();
  coverReader.onload = function(e) {
    mainImagePreview.innerHTML = `<img src="${e.target.result}" style="max-height:220px;max-width:100%;object-fit:contain;border-radius:10px;">`;
  };
  coverReader.readAsDataURL(coverFile);

  // 小圖預覽
  files.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const wrapper = document.createElement('div');
      wrapper.className = 'position-relative preview-item me-2 mb-2';
      wrapper.style.cursor = 'pointer';
      wrapper.innerHTML = `
        <img src="${e.target.result}" class="img-thumbnail" style="width:80px;height:80px;object-fit:cover;">
        <div class="position-absolute top-0 end-0">
          <input type="radio" name="cover_choice" value="${idx}" class="btn-check" id="cover_${idx}" ${idx === coverIdx ? 'checked' : ''}>
          <label class="btn btn-sm btn-outline-primary" for="cover_${idx}">封面</label>
        </div>
      `;
      // 點小圖或 radio 都可切換主圖
      wrapper.querySelector('img').addEventListener('click', function() {
        updateImagePreviews(idx);
      });
      wrapper.querySelector('input[type="radio"]').addEventListener('change', function(e) {
        e.stopPropagation();
        updateImagePreviews(idx);
      });
      imagePreviewArea.appendChild(wrapper);
    };
    reader.readAsDataURL(file);
  });

  // 更新隱藏欄位
  if (coverIndexInput) coverIndexInput.value = coverIdx;
  if (imageOrderInput) imageOrderInput.value = files.map((_, i) => i).join(',');
}

if (uploadInput && imagePreviewArea && mainImagePreview) {
  uploadInput.addEventListener('change', () => updateImagePreviews(0));
}


// 標籤輸入 與 建議功能
document.addEventListener("DOMContentLoaded", function () {
  const tagInput = document.getElementById("tag-input");
  const tagHidden = document.querySelector("input[name='tag_names']");
  const tagList = document.getElementById("tag-list");
  const suggestions = document.getElementById("tag-suggestions");
  const tagSet = new Set();

  // 初始化標籤集合
  document.querySelector("form").addEventListener("submit", () => {
  tagHidden.value = [...tagSet].join(",");
  });

  const tagDataElement = document.getElementById("initial-tag-data");
  if (tagDataElement) {
    const tagDataString = tagDataElement.dataset.tags || '';
    const initialTags = tagDataString.split(',').map(t => t.trim()).filter(t => t);
    initialTags.forEach(tag => addTag(tag));
  }

  // 顯示所有已選標籤（帶 x.png 刪除圖）
  function renderTags() {
    tagList.innerHTML = "";
    tagSet.forEach(tag => {
      const span = document.createElement("span");
      span.className = "badge bg-light text-dark d-flex align-items-center me-1 position-relative";
      span.setAttribute("data-tag", tag);

      span.innerHTML = `
        <img src="/static/img/x.png"
             style="width:16px;height:16px;cursor:pointer;"
             class="me-1"
             onclick="this.parentElement.remove(); updateTags()">
        ${tag}
      `;

      tagList.appendChild(span);
    });
    tagHidden.value = [...tagSet].join(",");
  }

  // 點刪除後更新資料
  window.updateTags = function () {
    tagSet.clear();
    document.querySelectorAll('#tag-list span[data-tag]').forEach(span => {
      tagSet.add(span.getAttribute('data-tag'));
    });
    tagHidden.value = [...tagSet].join(",");
  };

  function addTag(tag) {
    tag = tag.trim();
    if (tag && !tagSet.has(tag)) {
      tagSet.add(tag);
      renderTags();
    }
  }

  // 按 Enter 加標籤
  tagInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(this.value);
      this.value = "";
      suggestions.innerHTML = "";
    }
    // 按 Tab 選建議標籤
    if (e.key === "Tab" && suggestions.firstChild) {
      e.preventDefault();
      tagInput.value = suggestions.firstChild.textContent.replace(/^#/, '');
      addTag(tagInput.value);
      tagInput.value = "";
      suggestions.innerHTML = "";
    }
  });

  // 預設按鈕加入
  document.querySelectorAll(".tag-option").forEach(btn => {
    btn.addEventListener("click", () => {
      addTag(btn.textContent.trim());
    });
  });

  // 自動補全
  let debounceTimer;
  tagInput.addEventListener("input", function () {
    clearTimeout(debounceTimer);
    const query = this.value.trim();
    if (!query) {
      suggestions.innerHTML = "";
      return;
    }
    debounceTimer = setTimeout(() => {
      fetch(`/tag/api/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          suggestions.innerHTML = "";
          data.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `#${item.name}`;
            li.classList.add("list-group-item");
            li.style.cursor = "pointer";
            li.addEventListener("click", () => {
              addTag(item.name);
              tagInput.value = "";
              suggestions.innerHTML = "";
            });
            suggestions.appendChild(li);
          });
        });
    }, 300);
  });

    // 表單送出前更新 tag_names
  document.querySelector("form").addEventListener("submit", () => {
    tagHidden.value = [...tagSet].join(",");
  });

  // 編輯頁初始化舊標籤
  if (window.initialTags) {
    window.initialTags.forEach(t => addTag(t));
  }

  // 點其他地方關閉提示
  document.addEventListener("click", function (e) {
    if (!suggestions.contains(e.target) && e.target !== tagInput) {
      suggestions.innerHTML = "";
    }
  });
});

// // 標籤輸入與點擊選取邏輯
// const tagInput = document.getElementById("tag-input");
// const tagHidden = document.querySelector("input[name='tag_names']");
// const tagList = document.getElementById("tag-list");
// let tagSet = new Set();

// tagInput.addEventListener("keydown", function(e) {
//   if (e.key === "Enter") {
//     e.preventDefault();
//     const val = this.value.trim();
//     if (val && !tagSet.has(val)) {
//       tagSet.add(val);
//       tagList.innerHTML += `<span class='badge bg-info text-dark me-1'>${val}</span>`;
//       tagHidden.value = [...tagSet].join(",");
//     }
//     this.value = "";
//   }
// });

// document.querySelectorAll(".tag-option").forEach(btn => {
//   btn.addEventListener("click", () => {
//     const val = btn.textContent.trim();
//     if (!tagSet.has(val)) {
//       tagSet.add(val);
//       tagList.innerHTML += `<span class='badge bg-info text-dark me-1'>${val}</span>`;
//       tagHidden.value = [...tagSet].join(",");
//     }
//   });
// });
