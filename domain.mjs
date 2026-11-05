export const CATEGORIES = Object.freeze(['Спорт', 'Игры', 'Творчество', 'Обучение', 'Мастер-классы', 'Квизы', 'Другое']);
export const PROFILES = Object.freeze([{ id: 'anya', name: 'Аня' }, { id: 'sasha', name: 'Саша' }].map(Object.freeze));
export const STORAGE_KEY = 'dosug.web.v1';
export const DEFAULT_FILTERS = Object.freeze({ query: '', category: null, freeOnly: false, maxPrice: null, day: 'any' });
const copy = value => JSON.parse(JSON.stringify(value));
const trim = value => typeof value === 'string' ? value.trim() : '';
const dayStart = value => { const d = new Date(value); d.setHours(0, 0, 0, 0); return d.getTime(); };
const shiftDays = (value, count) => { const d = new Date(value); d.setDate(d.getDate() + count); return d.getTime(); };
const id = () => globalThis.crypto?.randomUUID?.() || `event-${Date.now()}-${Math.random().toString(36).slice(2)}`;
function fail(code, message, errors) { const error = new Error(message); error.code = code; if (errors) error.errors = errors; return error; }

/** A publication stays active until the end of its local calendar day. */
export function isActive(event, now = Date.now()) {
  return event?.closed === false && Number.isFinite(event.startsAt) && event.startsAt > 0 && now < shiftDays(dayStart(event.startsAt), 1);
}

export function validate(event = {}, now = Date.now()) {
  const errors = {};
  if (trim(event.title).length < 3 || trim(event.title).length > 80) errors.title = 'Название должно содержать от 3 до 80 символов';
  if (trim(event.description).length < 20 || trim(event.description).length > 1000) errors.description = 'Описание должно содержать от 20 до 1000 символов';
  if (!Number.isFinite(event.startsAt) || !Number.isFinite(new Date(event.startsAt).getTime()) || event.startsAt <= now) errors.startsAt = 'Выберите будущую дату и время';
  if (trim(event.place).length < 3 || trim(event.place).length > 160) errors.place = 'Укажите место: от 3 до 160 символов';
  if (!Number.isInteger(event.price) || event.price < 0 || event.price > 100000) errors.price = 'Стоимость должна быть от 0 до 100 000 ₽, без копеек';
  if (trim(event.organizer).length < 2 || trim(event.organizer).length > 80) errors.organizer = 'Укажите организатора: от 2 до 80 символов';
  if (!CATEGORIES.includes(event.category)) errors.category = 'Выберите категорию из списка';
  if (!Number.isInteger(event.age) || event.age < 0 || event.age > 18) errors.age = 'Возрастное ограничение должно быть от 0 до 18 лет';
  return errors;
}

export function filterEvents(events, filters = {}, now = Date.now()) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  const query = trim(f.query).toLocaleLowerCase('ru');
  const today = dayStart(now);
  let interval = null;
  if (f.day === 'today') interval = [today, shiftDays(today, 1)];
  if (f.day === 'week') interval = [today, shiftDays(today, 7)];
  if (f.day === 'weekend') {
    const weekday = new Date(today).getDay();
    const start = weekday === 0 ? today : shiftDays(today, (6 - weekday + 7) % 7);
    interval = [start, shiftDays(start, weekday === 0 ? 1 : 2)];
  }
  return events.filter(event => isActive(event, now)
    && (!query || [event.title, event.description, event.place, event.organizer].some(value => value.toLocaleLowerCase('ru').includes(query)))
    && (!f.category || f.category === event.category)
    && (!f.freeOnly || event.price === 0)
    && (f.maxPrice === null || f.maxPrice === '' || f.maxPrice === undefined || event.price <= Number(f.maxPrice))
    && (!interval || event.startsAt >= interval[0] && event.startsAt < interval[1]))
    .sort((a, b) => a.startsAt - b.startsAt || a.id.localeCompare(b.id));
}

export function makeDemoEvents(now = Date.now()) {
  const at = (days, hour) => { const d = new Date(now); d.setDate(d.getDate() + days); d.setHours(hour, 0, 0, 0); return d.getTime(); };
  const data = [
    ['Настолки без повода', 'Знакомимся и играем в современные настольные игры. Ведущий объяснит правила, а игры уже ждут на месте.', 'Игры', 1, 18, 'Молодёжный центр «Точка», зал 3', 0, 12, 'Клуб «Свои»'],
    ['Йога для начинающих', 'Спокойная открытая тренировка: дыхание, растяжка и простые упражнения. Возьмите коврик и удобную одежду.', 'Спорт', 2, 11, 'Спортивный зал «Баланс», ул. Мира, 8', 0, 14, 'Сообщество «Движение»'],
    ['Рисуем город вместе', 'Встреча для любителей быстрых зарисовок. Опыт не нужен: берите блокнот и карандаши, будем учиться друг у друга.', 'Творчество', 3, 15, 'Библиотека, творческая мастерская', 0, 10, 'Арт-клуб «Линия»'],
    ['Снимай на смартфон', 'Открытая лекция о свете и композиции в мобильной фотографии. После короткой теории попробуем приёмы на практике.', 'Обучение', 4, 18, 'Креативный центр «Среда», аудитория 204', 0, 12, 'Фото-клуб'],
    ['Книжный обмен', 'Приносите книги, которыми готовы поделиться, и выбирайте новые истории. Можно прийти без книги и просто познакомиться.', 'Другое', 5, 16, 'Городская библиотека, холл первого этажа', 0, 0, 'Читательский клуб'],
    ['Музыкальный вечер', 'Камерная встреча с акустической музыкой и открытым микрофоном. Приходите послушать или исполнить свою любимую песню.', 'Творчество', 6, 19, 'Молодёжный центр «Точка», малый зал', 0, 12, 'Музыкальная гостиная'],
    ['Гончарная мастерская', 'Слепим небольшое изделие из глины под руководством мастера. Материалы и инструменты входят в стоимость участия.', 'Мастер-классы', 6, 14, 'Студия «Форма», ул. Центральная, 12', 600, 12, 'Студия «Форма»'],
    ['Квиз про кино', 'Командная интеллектуальная игра о любимых фильмах. Можно прийти своей командой или присоединиться к другим участникам.', 'Квизы', 7, 18, 'Культурный центр «Пульс», зал 2', 300, 16, 'Квиз-клуб']
  ];
  return data.map(([title, description, category, day, hour, place, price, age, organizer], i) => ({ id: `demo-${i + 1}-${id()}`, title, description, category, startsAt: at(day, hour), place, price, age, organizer, authorId: `demo_${i + 1}`, closed: false }));
}

function normalizeFilters(input) {
  const f = { ...DEFAULT_FILTERS, ...input };
  const category = f.category === '' ? null : f.category;
  const maxPrice = f.maxPrice === '' || f.maxPrice === undefined || f.maxPrice === null ? null : Number(f.maxPrice);
  if (category !== null && !CATEGORIES.includes(category)) throw fail('VALIDATION', 'Неизвестная категория', { category: 'Выберите категорию из списка' });
  if (maxPrice !== null && (!Number.isInteger(maxPrice) || maxPrice < 0 || maxPrice > 100000)) throw fail('VALIDATION', 'Некорректная максимальная цена', { maxPrice: 'Введите стоимость от 0 до 100 000 ₽' });
  if (!['any', 'today', 'week', 'weekend'].includes(f.day)) throw fail('VALIDATION', 'Неизвестный период');
  return { query: String(f.query ?? '').slice(0, 1000), category, freeOnly: Boolean(f.freeOnly), maxPrice, day: f.day };
}

function decode(raw) {
  const state = JSON.parse(raw);
  if (!state || state.version !== 1 || !PROFILES.some(p => p.id === state.profileId) || !Number.isFinite(state.seededAt) || !Array.isArray(state.events)) throw new Error('schema');
  const seen = new Set();
  const events = state.events.map(e => {
    if (!e || typeof e.id !== 'string' || !e.id || seen.has(e.id) || typeof e.authorId !== 'string' || !e.authorId || typeof e.closed !== 'boolean') throw new Error('event');
    seen.add(e.id);
    // Validate the record at a time before its start so archived events remain readable.
    if (Object.keys(validate(e, 0)).length) throw new Error('fields');
    return { id: e.id, title: e.title, description: e.description, category: e.category, startsAt: e.startsAt, place: e.place, price: e.price, age: e.age, organizer: e.organizer, authorId: e.authorId, closed: e.closed };
  });
  return { version: 1, profileId: state.profileId, seededAt: state.seededAt, events, filters: normalizeFilters(state.filters) };
}

/** A single snapshot is committed before the in-memory state changes. */
export function createStore(storage, now = () => Date.now()) {
  // Safari can deny access at the localStorage property getter itself.
  if (storage === undefined) {
    try { storage = globalThis.localStorage; } catch { storage = null; }
  }
  let state;
  let lastRaw;
  let recoveryNotice = null;
  let blocked = false;
  const fresh = () => ({ version: 1, profileId: 'anya', seededAt: now(), events: makeDemoEvents(now()), filters: { ...DEFAULT_FILTERS } });
  const storageError = () => fail('STORAGE', 'Не удалось сохранить данные в браузере. Проверьте доступное место и разрешение на хранение данных. Изменения не сохранены.');
  function commit(next) {
    const raw = JSON.stringify(next);
    try { storage.setItem(STORAGE_KEY, raw); }
    catch { recoveryNotice = 'Браузер не разрешил сохранить данные. Изменения не сохранены.'; throw storageError(); }
    state = next;
    lastRaw = raw;
    blocked = false;
    recoveryNotice = null;
  }
  function reload() {
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); }
    catch {
      if (!state) state = fresh();
      blocked = true;
      recoveryNotice = 'Хранилище браузера недоступно. Показаны примеры событий. Публикации нельзя сохранить.';
      return;
    }
    if (raw === lastRaw && state) return;
    if (raw === null) {
      const next = fresh();
      try { commit(next); } catch { state = next; lastRaw = null; blocked = true; }
      return;
    }
    try { state = decode(raw); lastRaw = raw; blocked = false; recoveryNotice = null; }
    catch {
      lastRaw = raw;
      state = { version: 1, profileId: 'anya', seededAt: now(), events: [], filters: { ...DEFAULT_FILTERS } };
      blocked = true;
      recoveryNotice = 'Сохранённые данные повреждены и не перезаписаны. В профиле можно восстановить демонстрационные данные.';
    }
  }
  function writable() { reload(); if (blocked) throw fail('STORAGE', recoveryNotice); }
  function owned(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) throw fail('NOT_FOUND', 'Событие не найдено');
    if (event.authorId !== state.profileId) throw fail('FORBIDDEN', 'Можно изменять только свои публикации');
    return event;
  }
  reload();
  return {
    getState() { reload(); return copy({ ...state, recoveryNotice }); },
    setProfile(profileId) {
      writable();
      if (!PROFILES.some(p => p.id === profileId)) throw fail('FORBIDDEN', 'Неизвестный демонстрационный профиль');
      commit({ ...state, profileId });
    },
    setFilters(partial) { writable(); commit({ ...state, filters: normalizeFilters({ ...state.filters, ...partial }) }); },
    saveEvent(candidate) {
      writable();
      if (!candidate || typeof candidate !== 'object') throw fail('VALIDATION', 'Заполните форму события');
      if (candidate.authorId && candidate.authorId !== state.profileId) throw fail('FORBIDDEN', 'Можно публиковать только от текущего профиля');
      const existing = candidate.id ? state.events.find(e => e.id === candidate.id) : null;
      if (existing) {
        owned(existing.id);
        if (existing.closed || existing.startsAt <= now()) throw fail('FORBIDDEN', 'Редактировать можно только свою незавершённую встречу до её начала');
      }
      if (candidate.closed) throw fail('FORBIDDEN', 'Для завершения используйте действие «Завершить публикацию»');
      const event = {
        id: existing?.id || trim(candidate.id) || id(), authorId: state.profileId, closed: false,
        title: trim(candidate.title), description: trim(candidate.description), category: candidate.category,
        startsAt: candidate.startsAt, place: trim(candidate.place), price: candidate.price, age: candidate.age,
        organizer: trim(candidate.organizer)
      };
      const errors = validate(event, now());
      if (Object.keys(errors).length) throw fail('VALIDATION', Object.values(errors)[0], errors);
      if (state.events.some(e => e.id !== event.id && e.authorId === state.profileId && isActive(e, now()))) throw fail('LIMIT', 'У вас уже есть актуальное событие. Отредактируйте или завершите его.');
      commit({ ...state, events: [...state.events.filter(e => e.id !== event.id), event] });
      return copy(event);
    },
    closeEvent(eventId) { writable(); owned(eventId); commit({ ...state, events: state.events.map(e => e.id === eventId ? { ...e, closed: true } : e) }); },
    deleteEvent(eventId) { writable(); owned(eventId); commit({ ...state, events: state.events.filter(e => e.id !== eventId) }); },
    resetDemo() { commit(fresh()); }
  };
}
