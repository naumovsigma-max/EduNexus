const STORAGE_KEY = 'edunexus-materials';
const USERS_KEY = 'edunexus-users';

const defaultMaterials = [
  {
    id: 'seed-teacher-1',
    title: 'Методический гайд по проектному обучению',
    type: 'Методичка',
    audience: 'teacher',
    author: 'Академический отдел',
    description: 'Набор практик для проведения межпредметных проектных недель',
    fileName: 'project-based-learning.pdf',
    fileSize: '2.4 MB',
    mimeType: 'application/pdf',
    materialUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    createdAt: '2026-03-23 15:20',
  },
  {
    id: 'seed-student-1',
    title: 'Алгебра карточки для повторения',
    type: 'Практикум',
    audience: 'student',
    author: 'Кафедра математики',
    description: 'Подборка упражнений и карточек для закрепления темы',
    fileName: 'algebra-notes.pdf',
    fileSize: '840 KB',
    mimeType: 'application/pdf',
    materialUrl: 'https://www.orimi.com/pdf-test.pdf',
    createdAt: '2026-03-23 15:30',
  },
  {
    id: 'seed-all-1',
    title: 'Навигатор по цифровому кампусу',
    type: 'Презентация',
    audience: 'all',
    author: 'Команда платформы',
    description: 'Онбординг по навигации расписанию библиотеке и ролям на платформе',
    fileName: 'campus-onboarding.pptx',
    fileSize: '5.1 MB',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    materialUrl: 'https://file-examples.com/storage/fe9f8f9b66d083f35f15f95/2017/08/file_example_PPT_500kB.ppt',
    createdAt: '2026-03-23 15:40',
  },
];

function loadMaterials() {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMaterials));
    return [...defaultMaterials];
  }

  try {
    return JSON.parse(existing);
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultMaterials));
    return [...defaultMaterials];
  }
}

function saveMaterials(materials) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
}

function formatAudience(audience) {
  if (audience === 'teacher') return 'Учителя';
  if (audience === 'student') return 'Ученики';
  return 'Все роли';
}

function canPreview(item) {
  if (!item.materialUrl) return false;
  const fileName = (item.fileName || '').toLowerCase();
  const mime = item.mimeType || '';
  return mime.includes('pdf') || mime.includes('image') || mime.includes('video') || fileName.endsWith('.pdf') || fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp') || fileName.endsWith('.mp4') || item.type === 'Презентация';
}

function getPreviewUrl(item) {
  if (!item.materialUrl) return '';
  if (item.type === 'Презентация' || (item.fileName || '').toLowerCase().endsWith('.ppt') || (item.fileName || '').toLowerCase().endsWith('.pptx')) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(item.materialUrl)}`;
  }
  return item.materialUrl;
}

function renderMaterials() {
  const materials = loadMaterials().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const containers = document.querySelectorAll('[data-materials-list]');

  containers.forEach((container) => {
    const audience = container.dataset.audience;
    const filtered = materials.filter((item) => {
      if (audience === 'admin') return true;
      return item.audience === audience || item.audience === 'all';
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state">Пока материалов нет Загрузите первый ресурс в админ панели</div>';
      return;
    }

    container.innerHTML = filtered
      .map((item) => {
        const deleteButton = audience === 'admin' ? `<button type="button" data-delete-id="${item.id}">Удалить</button>` : '';
        const previewButton = canPreview(item)
          ? `<button type="button" data-preview-id="${item.id}">Просмотр</button>`
          : '';
        const downloadLink = item.materialUrl
          ? `<a class="button button--secondary button--small" href="${item.materialUrl}" target="_blank" rel="noopener">Открыть файл</a>`
          : '';

        return `
          <article class="material-card">
            <div class="material-card__header">
              <div>
                <div class="material-tag">${item.type}</div>
                <h3>${item.title}</h3>
              </div>
              ${deleteButton}
            </div>
            <p>${item.description}</p>
            <div class="material-meta">
              <span>Для ${formatAudience(item.audience)}</span>
              <span>Автор ${item.author}</span>
              <span>Файл ${item.fileName}</span>
              <span>Размер ${item.fileSize}</span>
              <span>Добавлен ${item.createdAt}</span>
            </div>
            <div class="material-card__actions">
              ${previewButton}
              ${downloadLink}
            </div>
          </article>
        `;
      })
      .join('');
  });

  document.querySelectorAll('[data-delete-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextMaterials = loadMaterials().filter((item) => item.id !== button.dataset.deleteId);
      saveMaterials(nextMaterials);
      renderMaterials();
      renderStats();
    });
  });

  document.querySelectorAll('[data-preview-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = loadMaterials().find((material) => material.id === button.dataset.previewId);
      if (!item) return;
      openPreview(item);
    });
  });
}

function openPreview(item) {
  const modal = document.getElementById('preview-modal');
  const frame = document.getElementById('preview-frame');
  const title = document.getElementById('preview-title');
  if (!modal || !frame || !title) return;

  title.textContent = item.title;
  frame.src = getPreviewUrl(item);
  modal.classList.add('is-open');
}

function bindPreviewModal() {
  const modal = document.getElementById('preview-modal');
  const close = document.getElementById('preview-close');
  const frame = document.getElementById('preview-frame');
  if (!modal || !close || !frame) return;

  close.addEventListener('click', () => {
    modal.classList.remove('is-open');
    frame.src = '';
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.remove('is-open');
      frame.src = '';
    }
  });
}

function renderStats() {
  const statAll = document.querySelector('[data-stat="all"]');
  const statTeacher = document.querySelector('[data-stat="teacher"]');
  const statStudent = document.querySelector('[data-stat="student"]');

  if (!statAll || !statTeacher || !statStudent) return;

  const materials = loadMaterials();
  const teacherCount = materials.filter((item) => item.audience === 'teacher' || item.audience === 'all').length;
  const studentCount = materials.filter((item) => item.audience === 'student' || item.audience === 'all').length;

  statAll.textContent = String(materials.length);
  statTeacher.textContent = String(teacherCount);
  statStudent.textContent = String(studentCount);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
}

function bindUploadForm() {
  const form = document.getElementById('upload-form');
  const clearButton = document.getElementById('clear-materials');
  const message = document.getElementById('form-message');

  if (!form || !message) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const file = formData.get('file');
    const urlField = String(formData.get('externalUrl') || '').trim();

    if ((!(file instanceof File) || !file.name) && !urlField) {
      message.textContent = 'Добавьте файл или ссылку на материал';
      message.className = 'form-message is-error';
      return;
    }

    let materialUrl = urlField;
    let fileName = 'Внешний материал';
    let fileSize = '—';
    let mimeType = '';

    if (file instanceof File && file.name) {
      fileName = file.name;
      fileSize = `${Math.max(1, Math.round(file.size / 1024))} KB`;
      mimeType = file.type;
      if (!materialUrl) {
        try {
          materialUrl = await fileToDataUrl(file);
        } catch {
          message.textContent = 'Не удалось прочитать файл Попробуйте снова';
          message.className = 'form-message is-error';
          return;
        }
      }
    }

    const now = new Date();
    const newMaterial = {
      id: String(now.getTime()),
      title: String(formData.get('title')).trim(),
      type: String(formData.get('type')).trim(),
      audience: String(formData.get('audience')).trim(),
      author: String(formData.get('author')).trim(),
      description: String(formData.get('description')).trim(),
      fileName,
      fileSize,
      mimeType,
      materialUrl,
      createdAt: now.toISOString().slice(0, 16).replace('T', ' '),
    };

    const materials = loadMaterials();
    materials.push(newMaterial);
    saveMaterials(materials);
    form.reset();
    message.textContent = 'Материал опубликован и доступен для просмотра на сайте';
    message.className = 'form-message is-success';
    renderMaterials();
    renderStats();
  });

  clearButton?.addEventListener('click', () => {
    saveMaterials([]);
    message.textContent = 'Каталог очищен';
    message.className = 'form-message is-success';
    renderMaterials();
    renderStats();
  });
}

function bindRegistrationForm() {
  const form = document.getElementById('registration-form');
  const message = document.getElementById('registration-message');
  const usersCounter = document.getElementById('registered-count');

  if (!form || !message) return;

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  if (usersCounter) usersCounter.textContent = String(users.length);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const fullName = String(formData.get('fullName')).trim();
    const email = String(formData.get('email')).trim().toLowerCase();
    const role = String(formData.get('role')).trim();
    const password = String(formData.get('password'));
    const confirmPassword = String(formData.get('confirmPassword'));

    if (fullName.length < 3) {
      message.textContent = 'Введите имя не короче 3 символов';
      message.className = 'form-message is-error';
      return;
    }

    if (!email.includes('@')) {
      message.textContent = 'Введите корректную почту';
      message.className = 'form-message is-error';
      return;
    }

    if (password.length < 8) {
      message.textContent = 'Пароль должен быть не короче 8 символов';
      message.className = 'form-message is-error';
      return;
    }

    if (password !== confirmPassword) {
      message.textContent = 'Пароли не совпадают';
      message.className = 'form-message is-error';
      return;
    }

    const usersList = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    if (usersList.some((user) => user.email === email)) {
      message.textContent = 'Пользователь с такой почтой уже зарегистрирован';
      message.className = 'form-message is-error';
      return;
    }

    usersList.push({ id: Date.now(), fullName, email, role, createdAt: new Date().toISOString() });
    localStorage.setItem(USERS_KEY, JSON.stringify(usersList));
    if (usersCounter) usersCounter.textContent = String(usersList.length);

    form.reset();
    message.textContent = `Регистрация завершена Добро пожаловать ${fullName}`;
    message.className = 'form-message is-success';
  });
}

function bootstrap() {
  if (!('localStorage' in window)) return;

  renderMaterials();
  renderStats();
  bindUploadForm();
  bindPreviewModal();
  bindRegistrationForm();
}

bootstrap();
