window.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector('.header');
  const content = document.querySelector('.main-content');
  if (header && content) {
    content.style.marginTop = header.offsetHeight + 'px';
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const imageInput = document.getElementById('id_images');
  const mainPreview = document.getElementById('main-image-preview');
  const previewArea = document.getElementById('image-preview');
  const uploadBox = document.querySelector('.image-upload-box');
  const coverIndexInput = document.querySelector('input[name="cover_index"]');
  const imageOrderInput = document.querySelector('input[name="image_order"]');

  // 點擊大框或小預覽都可開啟檔案選擇
  if (uploadBox && imageInput) {
    uploadBox.addEventListener('click', () => imageInput.click());
  }


  // 更新主圖與小圖預覽
  function updateImagePreviews(selectedCoverIdx = 0) {
    const files = Array.from(imageInput.files);
    previewArea.innerHTML = '';
    mainPreview.innerHTML = '';

    if (files.length === 0) {
      mainPreview.innerHTML = '<span style="color:#ff69b4;font-size:1.2rem;">＋ 新增圖片</span>';
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
    mainPreview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;

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
        // 點小圖可切換主圖
        wrapper.querySelector('input[type="radio"]').addEventListener('change', function(e) {
          e.stopPropagation();
          updateImagePreviews(idx);
        });
        previewArea.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    });

    // 更新隱藏欄位
    if (coverIndexInput) coverIndexInput.value = coverIdx;
    if (imageOrderInput) imageOrderInput.value = files.map((_, i) => i).join(',');
  }

  if (imageInput && previewArea && mainPreview) {
    imageInput.addEventListener('change', () => updateImagePreviews(0));
  }
});


// document.addEventListener('DOMContentLoaded', function() {
//     // 圖片預覽和拖曳功能
//     const imagePreview = document.getElementById('image-preview');
//     const fileInput = document.getElementById('id_images');
//     const fileCountSpan = document.getElementById('file-count');
//     const coverIndexInput = document.getElementById('id_cover_index');
//     const imageOrderInput = document.getElementById('id_image_order');
//     let previewItems = [];
//       // 初始化拖曳功能
//     if (imagePreview) {
//         const sortable = new Sortable(imagePreview, {
//             animation: 150,
//             filter: '.add-image',
//             onEnd: updateImageOrder
//         });
//     }

//     // 監聽檔案選擇
//     fileInput.addEventListener('change', function(e) {
//         const files = e.target.files;
//         if (!files.length) return;
        
//         fileCountSpan.textContent = 已選擇 ${files.length} 個檔案;

        
//         // 添加新預覽
//         for (let i = 0; i < files.length; i++) {
//             const file = files[i];
//             if (!file.type.startsWith('image/')) continue;
            
//             const reader = new FileReader();
//             reader.onload = function(e) {
//                 const div = document.createElement('div');
//                 div.className = 'preview-item' + (i === 0 ? ' is-cover' : '');
//                 div.innerHTML = <img src="${e.target.result}" alt="Preview">;
//                 div.dataset.index = i;
                
//                 // 點擊設為封面
//                 div.addEventListener('click', function() {
//                     document.querySelectorAll('.preview-item').forEach(item => {
//                         item.classList.remove('is-cover');
//                     });
//                     this.classList.add('is-cover');
//                     updateCoverIndex();
//                 });
                
//                 imagePreview.appendChild(div);
//             };
//             reader.readAsDataURL(file);
//         }
        
//         setTimeout(updateImageOrder, 100);
//         setTimeout(updateCoverIndex, 100);
//     });
    
//     // 更新圖片順序
//     function updateImageOrder() {
//         const items = [...document.querySelectorAll('.preview-item:not(.existing-image)')];
//         const indices = items.map(item => item.dataset.index);
//         imageOrderInput.value = indices.join(',');
        
//         // 更新封面索引
//         updateCoverIndex();
//     }
    
//     // 更新封面索引
//     function updateCoverIndex() {
//         const coverItem = document.querySelector('.preview-item.is-cover:not(.existing-image)');
//         if (coverItem) {
//             coverIndexInput.value = coverItem.dataset.index;
//         } else {
//             // 如果沒有新上傳的圖片被設為封面
//             const existingCover = document.querySelector('.existing-image.is-cover');
//             if (existingCover) {
//                 coverIndexInput.value = -1; // 表示使用既有封面
//             } else {
//                 coverIndexInput.value = 0; // 預設第一張
//             }
//         }
//     }
//       // 處理既有圖片
//     document.querySelectorAll('.existing-image').forEach(item => {
//         item.addEventListener('click', function() {
//             document.querySelectorAll('.preview-item').forEach(el => {
//                 el.classList.remove('is-cover');
//             });
//             this.classList.add('is-cover');
            
//             // 使用表單提交方式設為封面，將圖片ID存入隱藏欄位
//             const imgId = this.dataset.id;
//             if (imgId) {
//                 const coverIdInput = document.getElementById('id_cover_image_id');
//                 if (coverIdInput) {
//                     coverIdInput.value = imgId;
//                 }
//             }
//         });
//     });
    
//     // 標籤功能
//     const tagInput = document.getElementById('tag-input');
//     const addTagBtn = document.getElementById('add-tag-btn');
//     const tagArea = document.getElementById('tag-area');
//     const tagNamesInput = document.getElementById('id_tag_names');
//     let tags = new Set();
    
//     // 從現有標籤初始化
//     document.querySelectorAll('.tag-badge').forEach(badge => {
//         tags.add(badge.dataset.tag);
//     });
//     updateTagsHiddenInput();
    
//     // 添加標籤
//     function addTag(tagName) {
//         tagName = tagName.trim();
//         if (!tagName || tags.has(tagName)) return;
        
//         tags.add(tagName);
        
//         const badge = document.createElement('span');
//         badge.className = 'tag-badge';
//         badge.dataset.tag = tagName;
//         badge.innerHTML = ${tagName}<span class="remove">&times;</span>;
        
//         badge.querySelector('.remove').addEventListener('click', function() {
//             badge.remove();
//             tags.delete(tagName);
//             updateTagsHiddenInput();
//         });
        
//         tagArea.appendChild(badge);
//         updateTagsHiddenInput();
//     }
//       // 更新隱藏輸入框
//     function updateTagsHiddenInput() {
//         if (tagNamesInput) {
//             tagNamesInput.value = Array.from(tags).join(',');
//             console.log('更新標籤輸入框:', tagNamesInput.value);
//         }
//     }
    
//     // 監聽Enter鍵
//     if (tagInput) {
//         tagInput.addEventListener('keydown', function(e) {
//             if (e.key === 'Enter') {
//                 e.preventDefault();
//                 addTag(this.value);
//                 this.value = '';
//             }
//         });
//     }
    
//     // 點擊添加標籤按鈕
//     addTagBtn.addEventListener('click', function() {
//         addTag(tagInput.value);
//         tagInput.value = '';
//         tagInput.focus();
//     });
//       // 處理既有標籤的移除
//     document.querySelectorAll('.tag-badge .remove').forEach(btn => {
//         btn.addEventListener('click', function() {
//             const badge = this.parentElement;
//             const tagName = badge.dataset.tag;
//             badge.remove();
//             tags.delete(tagName);
//             updateTagsHiddenInput();
//         });
//     });
    
//     // 表單驗證
//     const form = document.querySelector('form');
//     if (form) {
//         form.addEventListener('submit', function(e) {
//             const title = document.getElementById('id_title');
//             if (title && !title.value.trim()) {
//                 e.preventDefault();
//                 alert('請輸入標題');
//                 title.focus();
//             }
            
//             // 記錄表單數據，幫助開發者調試
//             console.log('表單提交: ', {
//                 'title': document.getElementById('id_title')?.value,
//                 'cover_index': document.getElementById('id_cover_index')?.value,
//                 'image_order': document.getElementById('id_image_order')?.value,
//                 'cover_image_id': document.getElementById('id_cover_image_id')?.value,
//                 'tag_names': document.getElementById('id_tag_names')?.value
//             });
//         });
//     }
// }); 