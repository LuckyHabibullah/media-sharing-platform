const shareId = window.location.pathname.split('/').pop() || new URLSearchParams(window.location.search).get('id');
const container = document.getElementById('shareContent');

async function loadShareItem() {
  if (!container || !shareId) {
    container.innerHTML = `
      <div class="detail-card">
        <h1>Invalid share link</h1>
        <p>This link is missing a valid item ID.</p>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(`/api/media/${shareId}`);

    if (!response.ok) {
      throw new Error('Item not found');
    }

    const item = await response.json();
    const shareUrl = `${window.location.origin}/share/${item.id}`;

    container.innerHTML = `
      <div class="detail-card">
        <div class="detail-header">
          <span class="badge">${item.category}</span>
          <button class="share-btn" id="copyShareLink">Copy link</button>
        </div>

        <h1>${item.title}</h1>

        <div class="detail-main">
          <div class="detail-box">
            <h3>Type</h3>
            <p>${item.type}</p>
          </div>

          <div class="detail-box">
            <h3>Added</h3>
            <p>${new Date(item.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div class="detail-box" style="margin-top: 18px;">
          <h3>Description</h3>
          <p>${item.description || 'No description added yet.'}</p>
        </div>

        <div class="detail-box" style="margin-top: 18px;">
          <h3>Download</h3>
          <p>
            ${item.fileUrl ? `<a href="${item.fileUrl}" target="_blank" rel="noreferrer" class="primary-btn" style="margin-top: 10px; display: inline-flex;">Download file</a>` : 'No file attached for direct download.'}
          </p>
        </div>
      </div>
    `;

    const copyButton = document.getElementById('copyShareLink');
    if (copyButton) {
      copyButton.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          copyButton.textContent = 'Copied!';
          setTimeout(() => {
            copyButton.textContent = 'Copy link';
          }, 1200);
        } catch (error) {
          alert(`Share link: ${shareUrl}`);
        }
      });
    }
  } catch (error) {
    container.innerHTML = `
      <div class="detail-card">
        <h1>Item not found</h1>
        <p>This share link is invalid or the media has been removed.</p>
      </div>
    `;
  }
}

loadShareItem();
