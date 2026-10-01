const state = {
  category: 'all',
  search: ''
};

const grid = document.getElementById('mediaGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('filterCategory');
const uploadForm = document.getElementById('uploadForm');

function formatDate(dateString) {
  if (!dateString) return 'Recently';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function getMediaIcon(type) {
  const icons = {
    Game: '🎮',
    Movie: '🎬',
    App: '📱',
    Music: '🎵',
    File: '📁'
  };

  return icons[type] || '📦';
}

function getShareUrl(id) {
  return `${window.location.origin}/share/${id}`;
}

function renderMedia(items) {
  if (!grid) return;

  if (!items.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No media found</h3>
        <p>Try another search or upload your first file.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = items
    .map(
      (item) => `
        <article class="media-card">
          <div class="thumb">${getMediaIcon(item.type)}</div>
          <div class="content-top">
            <span class="badge">${item.category}</span>
            <span class="meta-text">${item.type}</span>
          </div>
          <h3>${item.title}</h3>
          <p>${item.description || 'No description added yet.'}</p>
          <div class="meta-text">Added ${formatDate(item.createdAt)}</div>
          <div class="card-actions">
            <a class="card-btn primary" href="${getShareUrl(item.id)}" target="_blank" rel="noreferrer">Open</a>
            <button class="share-btn" data-share-id="${item.id}">Copy link</button>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('[data-share-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.dataset.shareId;
      const shareUrl = getShareUrl(id);

      try {
        await navigator.clipboard.writeText(shareUrl);
        button.textContent = 'Copied!';
        setTimeout(() => {
          button.textContent = 'Copy link';
        }, 1200);
      } catch (error) {
        alert(`Share link: ${shareUrl}`);
      }
    });
  });
}

async function fetchMedia() {
  const params = new URLSearchParams();

  if (state.category !== 'all') params.append('category', state.category);
  if (state.search) params.append('search', state.search);

  const response = await fetch(`/api/media?${params.toString()}`);
  const items = await response.json();
  renderMedia(items);
}

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    state.search = event.target.value.trim();
    fetchMedia();
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener('change', (event) => {
    state.category = event.target.value;
    fetchMedia();
  });
}

if (uploadForm) {
  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(uploadForm);
    const submitButton = uploadForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to save item');
      }

      uploadForm.reset();
      await fetchMedia();
      alert('Media item saved successfully!');
    } catch (error) {
      alert(error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Save item';
    }
  });
}

fetchMedia();
