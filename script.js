const STORAGE_KEY = 'edunexus-materials';

const defaultMaterials = [
  {
    id: 'seed-teacher-1',
    title: 'Методический гайд по проектному обучению',
    type: 'Методичка',
    audience: 'teacher',
    author: 'Academic Office',
    description: 'Набор практик для проведения межпредметных проектных недель.',
    fileName: 'project-based-learning.pdf',
    fileSize: '2.4 MB',
    createdAt: '2026-03-23 15:20',
  },
  {
    id: 'seed-student-1',
    title: 'Алгебра: карточки для повторения',
    type: 'Практикум',
    audience: 'student',
    author: 'Math Department',
    description: 'Персональная подборка упражнений и flash cards для закрепления темы.',
    fileName: 'algebra-flashcards.zip',
    fileSize: '840 KB',
    createdAt: '2026-03-23 15:30',
  },
  {
    id: 'seed-all-1',
    title: 'Навигатор по цифровому кампусу',
    type: 'Презентация',
    audience: 'all',
    author: 'Platform Team',
    description: 'Онбординг по навигации, расписанию, библиотеке и ролям на платформе.',
    fileName: 'campus-onboarding.pptx',
    fileSize: '5.1 MB',
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
      container.innerHTML = '<div class="empty-state">Пока материалов нет. Загрузите первый ресурс в админ-панели.</div>';
      return;
    }

    container.innerHTML = filtered
      .map((item) => {
        const deleteButton =
          audience === 'admin'
            ? `<button type="button" data-delete-id="${item.id}">Удалить</button>`
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
              <span>Для: ${formatAudience(item.audience)}</span>
              <span>Автор: ${item.author}</span>
              <span>Файл: ${item.fileName}</span>
              <span>Размер: ${item.fileSize}</span>
              <span>Добавлен: ${item.createdAt}</span>
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
}

function renderStats() {
  const statAll = document.querySelector('[data-stat="all"]');
  const statTeacher = document.querySelector('[data-stat="teacher"]');
  const statStudent = document.querySelector('[data-stat="student"]');

  if (!statAll || !statTeacher || !statStudent) {
    return;
  }

  const materials = loadMaterials();
  const teacherCount = materials.filter((item) => item.audience === 'teacher' || item.audience === 'all').length;
  const studentCount = materials.filter((item) => item.audience === 'student' || item.audience === 'all').length;

  statAll.textContent = String(materials.length);
  statTeacher.textContent = String(teacherCount);
  statStudent.textContent = String(studentCount);
}

function bindUploadForm() {
  const form = document.getElementById('upload-form');
  const clearButton = document.getElementById('clear-materials');
  const message = document.getElementById('form-message');

  if (!form || !message) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const file = formData.get('file');

    if (!(file instanceof File) || !file.name) {
      message.textContent = 'Выберите файл для публикации материала.';
      message.className = 'form-message is-error';
      return;
    }

    const now = new Date();
    const newMaterial = {
      id: String(now.getTime()),
      title: String(formData.get('title')).trim(),
      type: String(formData.get('type')).trim(),
      audience: String(formData.get('audience')).trim(),
      author: String(formData.get('author')).trim(),
      description: String(formData.get('description')).trim(),
      fileName: file.name,
      fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      createdAt: now.toISOString().slice(0, 16).replace('T', ' '),
    };

    const materials = loadMaterials();
    materials.push(newMaterial);
    saveMaterials(materials);
    form.reset();
    message.textContent = 'Материал успешно опубликован и уже доступен на страницах ролей.';
    message.className = 'form-message is-success';
    renderMaterials();
    renderStats();
  });

  clearButton?.addEventListener('click', () => {
    saveMaterials([]);
    message.textContent = 'Каталог очищен.';
    message.className = 'form-message is-success';
    renderMaterials();
    renderStats();
  });
}

function bootstrap() {
  if (!('localStorage' in window)) {
    return;
  }

  renderMaterials();
  renderStats();
  bindUploadForm();
}

bootstrap();
