/* ============================================================
   Доп. банк заданий (~+80% к каждому набору).
   Подключается после banks.js и расширяет window.Banks.
   ============================================================ */
(function () {
  const B = window.Banks;
  if (!B) return;

  /* ---------- Фишинг: было 12 → цель 22 (+10) ---------- */
  B.phishing.push(
    {
      from: 'security@<span class="zone" data-bad="1" data-why="Подделка под Сбер с лишним доменом">sber-secure-login.info</span>',
      subj: '<span class="zone" data-bad="1" data-why="Угроза блокировкой">Карта заблокирована через 1 час</span>',
      body:
        'Подтвердите операцию: введите <span class="zone" data-bad="1" data-why="Банк не просит PIN в письме">PIN-код карты</span> на странице <span class="zone link" data-bad="1" data-why="Левый домен">http://sber-card-check.info</span>. Иначе <span class="zone" data-bad="0" data-why="Обычная фраза">доступ будет ограничен</span>.',
      bad: 4,
    },
    {
      from: '<span class="zone" data-bad="0" data-why="Имя выглядит знакомо">курьер</span>@<span class="zone" data-bad="1" data-why="Не домен Яндекса.Доставки">ya-dostavka.top</span>',
      subj: "Ваш заказ у двери — подтвердите получение",
      body:
        'Курьер ждёт. Откройте дверь-код: <span class="zone" data-bad="1" data-why="Просьба прислать код из SMS">пришлите код из SMS</span>. Оплата доставки: <span class="zone link" data-bad="1" data-why="Фишинговая оплата">http://pay-courier.top</span>. Трек <span class="zone" data-bad="0" data-why="Номер сам по себе не флаг">YD-99102</span>.',
      bad: 3,
    },
    {
      from: 'noreply@<span class="zone" data-bad="1" data-why="vk-соm с латинской «с» вместо «c» выглядит почти как vk.com">vk-соm-support.ru</span>',
      subj: '<span class="zone" data-bad="1" data-why="Страх потерять аккаунт">Вашу страницу пытаются взломать</span>',
      body:
        'Срочно смените пароль: <span class="zone link" data-bad="1" data-why="Поддельная страница входа">http://vk-security-page.cc/login</span>. Также укажите <span class="zone" data-bad="1" data-why="Выманивание почты восстановления">запасную почту</span>. <span class="zone" data-bad="0" data-why="Шаблонная подпись">Служба безопасности</span>.',
      bad: 4,
    },
    {
      from: '<span class="zone" data-bad="1" data-why="Личная почта «от деканата»">dekanat.help@gmail.com</span>',
      subj: "Стипендия — заполните форму сегодня",
      body:
        'Иначе стипендию заморозят. Форма: <span class="zone link" data-bad="1" data-why="Сторонний Google Forms / левый сайт">http://stipendia-form.xyz</span>. Нужны <span class="zone" data-bad="1" data-why="Паспортные данные по сомнительной ссылке">серия и номер паспорта</span>. Вопросы — <span class="zone" data-bad="0" data-why="Не флаг">ответьте на письмо</span>.',
      bad: 3,
    },
    {
      from: 'appleid@<span class="zone" data-bad="1" data-why="appie вместо apple">appie-id.com</span>',
      subj: '<span class="zone" data-bad="1" data-why="Давление срочностью">Ваш Apple ID будет отключён</span>',
      body:
        'Подтвердите покупку на 8990 ₽ или отмените: <span class="zone link" data-bad="1" data-why="Фишинговый Apple ID">http://appleid-verify.appie-id.com</span>. Введите <span class="zone" data-bad="1" data-why="Пароль Apple ID нельзя вводить на левых сайтах">пароль Apple ID</span>. ID: <span class="zone" data-bad="0" data-why="Случайный номер">A4821</span>.',
      bad: 4,
    },
    {
      from: 'hr@<span class="zone" data-bad="0" data-why="Корпоративный вид">college.ru</span>',
      subj: "Новая форма для практики (PDF)",
      body:
        'Заполните вложение <span class="zone" data-bad="1" data-why="Макросы в .docm опасны">practice_form.docm</span> и пришлите. Либо скачайте с <span class="zone link" data-bad="1" data-why="Не домен колледжа">http://college-docs.online/form</span>. Контакт: <span class="zone" data-bad="0" data-why="Нормальная строка">учебная часть</span>.',
      bad: 2,
    },
    {
      from: 'tax@<span class="zone" data-bad="1" data-why="Подделка под ФНС">nalog-refund.su</span>',
      subj: '<span class="zone" data-bad="1" data-why="Неожиданный «возврат»">Вам положен налоговый вычет 48 200 ₽</span>',
      body:
        'Для зачисления укажите <span class="zone" data-bad="1" data-why="Реквизиты карты мошенникам">номер карты и срок</span>. Кабинет: <span class="zone link" data-bad="1" data-why="Не nalog.gov.ru">http://cabinet-nalog.su</span>. Справка <span class="zone" data-bad="0" data-why="Номер сам не флаг">№НДФЛ-77</span>.',
      bad: 4,
    },
    {
      from: '<span class="zone" data-bad="1" data-why="Неизвестный «одногруппник»">max.group2026@mail.ru</span>',
      subj: "Кинь доступ к общему диску группы",
      body:
        'Мне удалили аккаунт. Пришли <span class="zone" data-bad="1" data-why="Пароль от диска нельзя слать">логин и пароль от диска</span> или пригласи по ссылке <span class="zone link" data-bad="1" data-why="Подозрительная короткая ссылка">http://bit.ly/disk-grp</span>. Спасибо, <span class="zone" data-bad="0" data-why="Имя в конце не флаг">Макс</span>.',
      bad: 3,
    },
    {
      from: 'noreply@<span class="zone" data-bad="1" data-why="wildberrles — опечатка">wildberrles-pay.ru</span>',
      subj: '<span class="zone" data-bad="1" data-why="Страх списания">Ошибка оплаты — спишут повторно</span>',
      body:
        'Отмените списание: <span class="zone link" data-bad="1" data-why="Фейковая касса маркетплейса">http://wb-cancel-pay.ru</span>. Введите <span class="zone" data-bad="1" data-why="CVC нельзя вводить на левых сайтах">CVC карты</span>. Заказ <span class="zone" data-bad="0" data-why="Номер заказа не флаг">WB-22091</span>.',
      bad: 4,
    },
    {
      from: 'it@<span class="zone" data-bad="1" data-why="Домен не ваш колледж">helpdesk-ru.net</span>',
      subj: "Проверка почты: ответьте с паролем «для теста SPF»",
      body:
        'Для настройки фильтров ответьте письмом с <span class="zone" data-bad="1" data-why="Пароль почты никогда не просят в ответе">вашим паролем почты</span>. Инструкция: <span class="zone link" data-bad="1" data-why="Левый helpdesk">http://helpdesk-ru.net/spf</span>. Тикет <span class="zone" data-bad="0" data-why="Номер тикета">#4412</span>.',
      bad: 3,
    }
  );

  /* ---------- Инцидент: 15 → 27 (+12) ---------- */
  B.incident.push(
    {
      prompt: "В общем чате группы скинули «бесплатный VPN для учёбы» — установщик .exe.",
      sub: "Одногруппники уже ставят. Что делаешь?",
      options: [
        { label: "Не ставить, предупредить чат, скачать VPN только с официального сайта", ok: true },
        { label: "Поставить — раз все ставят", ok: false },
        { label: "Отключить антивирус и поставить «потише»", ok: false },
      ],
      hint: "Пиратский/левый VPN часто тащит стиллер паролей",
    },
    {
      prompt: "На экране: «Ваш ПК заражён, скачайте DoctorClean.exe».",
      sub: "Окно поверх браузера, кнопка огромная.",
      options: [
        { label: "Закрыть вкладку/процесс, проверить своим антивирусом", ok: true },
        { label: "Скачать DoctorClean и «полечить»", ok: false },
        { label: "Ввести номер карты в форме «разблокировки»", ok: false },
      ],
      hint: "Scareware пугает, чтобы подсунуть вредонос",
    },
    {
      prompt: "Преподаватель просит прислать курсовую на личную почту mail.ru «потому что корпоративная лежит».",
      sub: "Тема важная, дедлайн завтра.",
      options: [
        { label: "Уточнить лично/по известному каналу и слать через официальный диск колледжа", ok: true },
        { label: "Сразу выслать всё с приложениями на mail.ru", ok: false },
        { label: "Выложить курсовую в открытый чат «чтобы наверняка»", ok: false },
      ],
      hint: "Проверка канала связи важнее спешки",
    },
    {
      prompt: "Нашёл в коридоре бейдж сотрудника с магнитной полосой.",
      sub: "Рядом никого нет.",
      options: [
        { label: "Отнести на охрану / в бюро пропусков, не пользоваться", ok: true },
        { label: "Попробовать открыть дверь «ради прикола»", ok: false },
        { label: "Выложить фото бейджа в соцсети", ok: false },
      ],
      hint: "Чужой пропуск — физический доступ = риск",
    },
    {
      prompt: "Облачный диск пишет: «новый вход с iPhone, Германия». Ты в Москве без поездок.",
      sub: "Сессия активна прямо сейчас.",
      options: [
        { label: "Завершить чужие сессии, сменить пароль, включить 2FA", ok: true },
        { label: "Игнорировать уведомление", ok: false },
        { label: "Написать пароль другу «пусть проверит»", ok: false },
      ],
      hint: "Чужой вход = аккаунт уже под контролем",
    },
    {
      prompt: "QR-код на парковке: «Оплата парковки — отсканируй».",
      sub: "Код наклеен поверх другого.",
      options: [
        { label: "Не сканировать наклейку, платить через официальное приложение/кассу", ok: true },
        { label: "Отсканировать и ввести карту", ok: false },
        { label: "Переслать QR друзьям «удобная парковка»", ok: false },
      ],
      hint: "Подмена QR — частый способ фишинга",
    },
    {
      prompt: "В Discord «админ сервера» просит включить демонстрацию экрана с открытым менеджером паролей.",
      sub: "Якобы проверка на ботов.",
      options: [
        { label: "Отказать, не показывать секреты, проверить роль админа с модераторами", ok: true },
        { label: "Включить демонстрацию как просят", ok: false },
        { label: "Продиктовать пароли голосом «быстрее»", ok: false },
      ],
      hint: "Демо экрана с паролями = кража аккаунтов",
    },
    {
      prompt: "Рабочий ноутбук просит «обновить Flash Player» с неизвестного сайта.",
      sub: "Flash давно мёртв.",
      options: [
        { label: "Не устанавливать, закрыть, сообщить в ИБ", ok: true },
        { label: "Установить «чтобы сайт заработал»", ok: false },
        { label: "Скачать с первого сайта в поиске", ok: false },
      ],
      hint: "Устаревшие «апдейты» — классический троян",
    },
    {
      prompt: "В принтере очередь: документ «Зарплаты_секретно.pdf» от чужого логина.",
      sub: "Листы уже выходят.",
      options: [
        { label: "Забрать листы, отдать владельцу/ИБ, не фотографировать и не раздавать", ok: true },
        { label: "Сфоткать и кинуть в чат группы", ok: false },
        { label: "Выложить PDF в облако «для прозрачности»", ok: false },
      ],
      hint: "Утечка на принтере — тоже инцидент",
    },
    {
      prompt: "Скрипт «автозачёт» просит полный доступ к Google-аккаунту (чтение почты).",
      sub: "Выглядит удобно.",
      options: [
        { label: "Не выдавать широкие права неизвестному приложению", ok: true },
        { label: "Разрешить всё «временно»", ok: false },
        { label: "Ввести пароль Google на сайте скрипта", ok: false },
      ],
      hint: "OAuth-фик: лишние права = чтение всей почты",
    },
    {
      prompt: "После «бесплатной зарядки» в холле телефон сам ставит неизвестное приложение.",
      sub: "Кабель был чужой.",
      options: [
        { label: "Отключить, не открывать данные, проверить антивирусом / сброс при подозрении", ok: true },
        { label: "Дать приложению все разрешения", ok: false },
        { label: "Войти в банк с этого телефона сразу", ok: false },
      ],
      hint: "Juice jacking / вредонос с зарядки",
    },
    {
      prompt: "Коллега пересылает «важный» архив passwords.zip с паролем в том же письме.",
      sub: "Письмо пришло с внешнего ящика.",
      options: [
        { label: "Не открывать, спросить коллегу другим каналом, удалить письмо", ok: true },
        { label: "Распаковать и запустить содержимое", ok: false },
        { label: "Залить архив на общий диск «на всякий»", ok: false },
      ],
      hint: "Пароль к архиву в том же письме не защищает",
    }
  );

  /* ---------- Социнженерия: 10 → 18 (+8) ---------- */
  B.social.push(
    {
      them: "Я из поддержки маркетплейса. Чтобы вернуть товар, продиктуй код из SMS.",
      options: [
        { label: "Коды не диктую. Зайду в официальное приложение сам.", ok: true },
        { label: "Код: 482911…", ok: false },
      ],
      hint: "Код подтверждает вход злоумышленнику",
    },
    {
      them: "Скинь фото паспорта — оформляю тебе пропуск в коворкинг «за минуту».",
      options: [
        { label: "Паспорт не фотографирую в чат. Только через официальную стойку.", ok: true },
        { label: "Сейчас сфоткаю разворот…", ok: false },
      ],
      hint: "Скан паспорта = риск мошенничества",
    },
    {
      them: "Переведи мне 3000 «на материалы», ректор сказал тебе лично. Нельзя звонить — он на совещании.",
      options: [
        { label: "Не перевожу. Проверю у ректора / деканата по известному контакту.", ok: true },
        { label: "Ок, перевожу без проверки.", ok: false },
      ],
      hint: "Запрет перепроверки — красный флаг",
    },
    {
      them: "Дай remote-доступ AnyDesk «починить Wi‑Fi за 2 минуты».",
      options: [
        { label: "Удалёнку незнакомцам не даю. Позову знакомого админа.", ok: true },
        { label: "Ок, вот код AnyDesk…", ok: false },
      ],
      hint: "AnyDesk = полный контроль над ПК",
    },
    {
      them: "Напиши, в каком кабинете стоит сервер и кто охраняет ночью — для «аудита».",
      options: [
        { label: "Такие сведения только по официальному запросу ИБ.", ok: true },
        { label: "Сервер в 304, охрана до 22…", ok: false },
      ],
      hint: "Разведка физ. доступа — этап атаки",
    },
    {
      them: "Я новенький охранник. Скинь список кодов от сигнализации на сегодня.",
      options: [
        { label: "Коды не раздаю в мессенджере. Обратись к старшему смены.", ok: true },
        { label: "Держи коды…", ok: false },
      ],
      hint: "Социнженерия часто маскируется под «своего»",
    },
    {
      them: "Пройди по ссылке и подтверди, что ты не бот — иначе аккаунт игры забанят через 10 минут.",
      options: [
        { label: "Не перехожу по срочным ссылкам из чата. Проверю в официальном клиенте.", ok: true },
        { label: "Перехожу и ввожу логин.", ok: false },
      ],
      hint: "Срочность + ссылка = фишинг",
    },
    {
      them: "Пришли voice-сообщение с кодом из SMS — «голосовая проверка».",
      options: [
        { label: "Не записываю и не отправляю коды голосом.", ok: true },
        { label: "Ок, надиктовываю код…", ok: false },
      ],
      hint: "Голос тоже передаёт секрет",
    }
  );

  /* ---------- Шифр/радио: 12 → 22 (+10) ---------- */
  B.cipher.push(
    { text: "ФАЙРВОЛ", hint: "фильтр сетевого трафика" },
    { text: "ПАТЧ", hint: "исправление уязвимости" },
    { text: "МАЛВАР", hint: "вредоносное ПО (коротко)" },
    { text: "ТРОЯН", hint: "вредонос под видом полезного" },
    { text: "СПУФИНГ", hint: "подмена отправителя или адреса" },
    { text: "БОТНЕТ", hint: "сеть заражённых машин" },
    { text: "КЕЙЛОГ", hint: "запись нажатий клавиш" },
    { text: "САНДБОКС", hint: "песочница для подозричных файлов" },
    { text: "ИДЕНТИТИ", hint: "учётные данные личности" },
    { text: "РУТКИТ", hint: "скрытое присутствие в системе" }
  );

  /* ---------- Детектив: 6 → 11 (+5) ---------- */
  B.detective.push(
    [
      "Студент подключил телефон к чужому USB в аудитории",
      "На телефон установился скрытый модуль",
      "Утекли сессии мессенджера",
      "От имени студента написали одногруппникам с просьбой кода",
      "Двое передали коды — их аккаунты тоже захватили",
    ],
    [
      "На сайте колледжа нашли форму с опечаткой в домене",
      "Несколько абитуриентов ввели снилс и паспорт",
      "Данные ушли на сервер за границей",
      "Появились объявления «кредит по паспорту»",
      "Жертвы обратились в полицию и к администрации",
    ],
    [
      "Админ оставил RDP с паролем «Qwerty1»",
      "Сканер нашёл порт за ночь",
      "Подобран пароль, установлен бэкдор",
      "С сервера скачали архив с оценками",
      "Файл выложили на файлообменник",
    ],
    [
      "В письме «от банка» была ссылка на поддельный сайт",
      "Преподаватель ввёл логин интернет-банка",
      "С карты списали перевод «на безопасность»",
      "Параллельно скачали выписку за год",
      "Банк заблокировал карту после обращения",
    ],
    [
      "В лаборатории стоял открытый Wi‑Fi «Free_Lab»",
      "Злоумышленник раздал фейковый портал входа",
      "Студенты ввели пароли от почты",
      "Почты использовали для сброса других сервисов",
      "Цепочка аккаунтов оказалась скомпрометирована",
    ]
  );

  /* ---------- Network cases: 8 → 15 (+7) ---------- */
  B.networkCases.push(
    {
      asset: "Принт-сервер",
      problem: "Веб-панель принтера без пароля доступна из гостевой сети.",
      options: [
        { label: "Пароль на панель + убрать из гостевой сети", ok: true, hint: "Принтеры часто забывают закрыть." },
        { label: "Вывести панель в интернет «для удобства»", ok: false, hint: "Ещё хуже для периметра." },
        { label: "Оставить открытой — «это же только печать»", ok: false, hint: "Через принтер ходят во внутреннюю сеть." },
      ],
    },
    {
      asset: "Telegram-бот приёмной",
      problem: "Токен бота закоммичен в публичный репозиторий.",
      options: [
        { label: "Отозвать токен, выписать новый, убрать из git", ok: true, hint: "Утёкший токен = контроль над ботом." },
        { label: "Переименовать файл с токеном", ok: false, hint: "История git всё равно хранит секрет." },
        { label: "Написать в README «не копировать токен»", ok: false, hint: "Предупреждение не отзывает доступ." },
      ],
    },
    {
      asset: "1С / бухгалтерия",
      problem: "Бухгалтеры работают под одной общей учёткой.",
      options: [
        { label: "Персональные учётки + минимальные права", ok: true, hint: "Так видно, кто что сделал." },
        { label: "Выдать всем права администратора «на всякий»", ok: false, hint: "Лишние права ускоряют ущерб." },
        { label: "Запретить пароли длиннее 6 символов", ok: false, hint: "Слабые пароли ломают быстрее." },
      ],
    },
    {
      asset: "Резервные копии",
      problem: "Бэкапы лежат в той же шаре, что и рабочие файлы, без шифрования.",
      options: [
        { label: "Вынести бэкапы отдельно, шифровать, ограничить доступ", ok: true, hint: "Иначе шифровальщик убьёт и оригинал, и копию." },
        { label: "Отключить бэкапы «чтобы место не жрали»", ok: false, hint: "Без копий восстановление почти невозможно." },
        { label: "Сделать шару бэкапов доступной всем студентам", ok: false, hint: "Утечка и порча копий." },
      ],
    },
    {
      asset: "Docker на курсовой",
      problem: "Контейнер запущен от root с пробросом сокета Docker наружу.",
      options: [
        { label: "Убрать опасный проброс, запускать без лишних привилегий", ok: true, hint: "Docker.sock = ключ от хоста." },
        { label: "Открыть порт 2375 в интернет без TLS", ok: false, hint: "Публичный Docker API — захват сервера." },
        { label: "Скопировать секреты в образ «для удобства»", ok: false, hint: "Секреты в образе утекут." },
      ],
    },
    {
      asset: "Moodle / LMS",
      problem: "Плагин не обновляли 3 года, известен RCE.",
      options: [
        { label: "Обновить/удалить плагин, проверить логи", ok: true, hint: "Старые плагины — частая дыра LMS." },
        { label: "Скрыть ссылку на плагин в меню", ok: false, hint: "Скрытие ≠ патч." },
        { label: "Выдать студентам SSH «чтобы сами починили»", ok: false, hint: "Лишний доступ к серверу." },
      ],
    },
    {
      asset: "СКУД / турникеты",
      problem: "Контроллер турникетов в одной VLAN с студенческим Wi‑Fi.",
      options: [
        { label: "Выделить СКУД в отдельный сегмент, закрыть лишние порты", ok: true, hint: "Физ. безопасность ≠ IT-сеть гостей." },
        { label: "Открыть веб-морду СКУД в интернет", ok: false, hint: "Управление доступом с улицы — кошмар." },
        { label: "Оставить как есть — «турникеты же не компьютеры»", ok: false, hint: "IoT ломают так же." },
      ],
    }
  );

  /* ---------- Layouts hardening: 4 → 8 (+4) ---------- */
  B.networkLayouts.push(
    {
      nodes: [
        { id: "internet", ic: "wifi", name: "Интернет", x: 50, y: 10, fixed: true },
        { id: "fw", ic: "shield", name: "Файрвол", x: 50, y: 34, fixed: true },
        { id: "rdp", ic: "laptop", name: "RDP-сервер", x: 22, y: 72, vuln: true, issue: "RDP в интернет без 2FA" },
        { id: "db", ic: "server", name: "БД", x: 50, y: 88, vuln: true, issue: "Пароль sa/sa" },
        { id: "pc", ic: "laptop", name: "ПК кадры", x: 78, y: 72, safe: true, issue: "BitLocker + патчи" },
      ],
      wires: [[0, 1], [1, 2], [1, 3], [1, 4]],
    },
    {
      nodes: [
        { id: "internet", ic: "wifi", name: "Интернет", x: 50, y: 12, fixed: true },
        { id: "fw", ic: "shield", name: "UTS", x: 50, y: 36, fixed: true },
        { id: "git", ic: "server", name: "Git-сервер", x: 25, y: 75, vuln: true, issue: "Публичный .env в репо" },
        { id: "ci", ic: "server", name: "CI", x: 50, y: 88, vuln: true, issue: "Секреты в логах сборки" },
        { id: "dev", ic: "laptop", name: "Ноут разраба", x: 75, y: 75, safe: true, issue: "VPN + диск шифрован" },
      ],
      wires: [[0, 1], [1, 2], [1, 3], [1, 4]],
    },
    {
      nodes: [
        { id: "internet", ic: "wifi", name: "Интернет", x: 50, y: 10, fixed: true },
        { id: "fw", ic: "shield", name: "Периметр", x: 50, y: 35, fixed: true },
        { id: "iot", ic: "wifi", name: "Умные лампы", x: 20, y: 70, vuln: true, issue: "IoT в LAN без изоляции" },
        { id: "nas", ic: "server", name: "Архив", x: 50, y: 88, safe: true, issue: "Доступ по группам" },
        { id: "cam", ic: "laptop", name: "Камеры", x: 80, y: 70, vuln: true, issue: "Дефолтный пароль" },
      ],
      wires: [[0, 1], [1, 2], [1, 3], [1, 4]],
    },
    {
      nodes: [
        { id: "internet", ic: "wifi", name: "Интернет", x: 50, y: 12, fixed: true },
        { id: "fw", ic: "shield", name: "Шлюз", x: 50, y: 38, fixed: true },
        { id: "mail", ic: "mail", name: "Почта", x: 22, y: 78, vuln: true, issue: "Нет SPF/DKIM" },
        { id: "web", ic: "globe", name: "Лендинг", x: 50, y: 88, vuln: true, issue: "CMS без обновлений" },
        { id: "soc", ic: "shield", name: "SOC", x: 78, y: 78, safe: true, issue: "Мониторинг 24/7" },
      ],
      wires: [[0, 1], [1, 2], [1, 3], [1, 4]],
    }
  );

  /* ---------- Живые схемы атаки для network.js ---------- */
  B.liveNets = [
    {
      nodes: [
        { id: "net", name: "Интернет", ic: "wifi", x: 50, y: 10, role: "source" },
        { id: "fw", name: "Шлюз", ic: "shield", x: 50, y: 32, role: "hop", vuln: true, issue: "Слабое правило ACL" },
        { id: "wifi", name: "Wi‑Fi", ic: "wifi", x: 22, y: 58, role: "hop", vuln: true, issue: "Гостевая сеть в LAN" },
        { id: "mail", name: "Почта", ic: "mail", x: 78, y: 58, role: "hop", safe: true },
        { id: "srv", name: "Сервер", ic: "server", x: 35, y: 82, role: "hop", vuln: true, issue: "Без патча" },
        { id: "core", name: "ЯДРО", ic: "shield", x: 65, y: 88, role: "core" },
      ],
      edges: [["net", "fw"], ["fw", "wifi"], ["fw", "mail"], ["wifi", "srv"], ["mail", "core"], ["srv", "core"]],
    },
    {
      nodes: [
        { id: "net", name: "Интернет", ic: "wifi", x: 50, y: 8, role: "source" },
        { id: "fw", name: "Файрвол", ic: "shield", x: 50, y: 28, role: "hop", vuln: true, issue: "Открыт RDP наружу" },
        { id: "vpn", name: "VPN", ic: "key", x: 22, y: 52, role: "hop", vuln: true, issue: "Старый VPN без патча" },
        { id: "db", name: "БД", ic: "server", x: 78, y: 52, role: "hop", vuln: true, issue: "Слабый пароль БД" },
        { id: "pc", name: "Бухгалтерия", ic: "laptop", x: 35, y: 78, role: "hop", safe: true },
        { id: "core", name: "ЯДРО", ic: "shield", x: 70, y: 88, role: "core" },
      ],
      edges: [["net", "fw"], ["fw", "vpn"], ["fw", "db"], ["vpn", "pc"], ["db", "core"], ["pc", "core"]],
    },
    {
      nodes: [
        { id: "net", name: "Интернет", ic: "wifi", x: 50, y: 10, role: "source" },
        { id: "fw", name: "Периметр", ic: "shield", x: 50, y: 30, role: "hop", safe: true },
        { id: "web", name: "Сайт", ic: "globe", x: 25, y: 55, role: "hop", vuln: true, issue: "CMS без обновлений" },
        { id: "api", name: "API", ic: "server", x: 75, y: 55, role: "hop", vuln: true, issue: "Нет rate-limit" },
        { id: "nas", name: "Файлы", ic: "server", x: 40, y: 80, role: "hop", vuln: true, issue: "SMB guest" },
        { id: "core", name: "ЯДРО", ic: "shield", x: 70, y: 88, role: "core" },
      ],
      edges: [["net", "fw"], ["fw", "web"], ["fw", "api"], ["web", "nas"], ["api", "core"], ["nas", "core"]],
    },
    {
      nodes: [
        { id: "net", name: "Интернет", ic: "wifi", x: 48, y: 9, role: "source" },
        { id: "fw", name: "UTS", ic: "shield", x: 48, y: 30, role: "hop", vuln: true, issue: "Правило any-any" },
        { id: "mail", name: "Почта", ic: "mail", x: 20, y: 55, role: "hop", vuln: true, issue: "Нет MFA у админов" },
        { id: "lab", name: "Лаб. Wi‑Fi", ic: "wifi", x: 75, y: 55, role: "hop", vuln: true, issue: "Открытая сеть" },
        { id: "cam", name: "Камеры", ic: "laptop", x: 30, y: 82, role: "hop", safe: true },
        { id: "core", name: "ЯДРО", ic: "shield", x: 68, y: 88, role: "core" },
      ],
      edges: [["net", "fw"], ["fw", "mail"], ["fw", "lab"], ["mail", "core"], ["lab", "cam"], ["cam", "core"]],
    },
    {
      nodes: [
        { id: "net", name: "Интернет", ic: "wifi", x: 50, y: 10, role: "source" },
        { id: "fw", name: "Шлюз", ic: "shield", x: 50, y: 32, role: "hop", vuln: true, issue: "Telnet на периметре" },
        { id: "git", name: "Git", ic: "server", x: 22, y: 60, role: "hop", vuln: true, issue: "Секреты в репо" },
        { id: "ci", name: "CI", ic: "server", x: 78, y: 60, role: "hop", vuln: true, issue: "Привилегированный runner" },
        { id: "dev", name: "Dev-ПК", ic: "laptop", x: 40, y: 84, role: "hop", safe: true },
        { id: "core", name: "ЯДРО", ic: "shield", x: 72, y: 88, role: "core" },
      ],
      edges: [["net", "fw"], ["fw", "git"], ["fw", "ci"], ["git", "dev"], ["ci", "core"], ["dev", "core"]],
    },
    {
      nodes: [
        { id: "net", name: "Интернет", ic: "wifi", x: 50, y: 8, role: "source" },
        { id: "fw", name: "Файрвол", ic: "shield", x: 50, y: 28, role: "hop", safe: true },
        { id: "iot", name: "IoT", ic: "wifi", x: 20, y: 55, role: "hop", vuln: true, issue: "Камеры в LAN" },
        { id: "print", name: "Принтер", ic: "server", x: 78, y: 55, role: "hop", vuln: true, issue: "Панель без пароля" },
        { id: "hr", name: "ПК HR", ic: "laptop", x: 35, y: 80, role: "hop", vuln: true, issue: "Без шифрования диска" },
        { id: "core", name: "ЯДРО", ic: "shield", x: 70, y: 88, role: "core" },
      ],
      edges: [["net", "fw"], ["fw", "iot"], ["fw", "print"], ["iot", "hr"], ["print", "core"], ["hr", "core"]],
    },
    {
      nodes: [
        { id: "net", name: "Интернет", ic: "wifi", x: 50, y: 10, role: "source" },
        { id: "fw", name: "Периметр", ic: "shield", x: 50, y: 30, role: "hop", vuln: true, issue: "Устаревшие правила" },
        { id: "stud", name: "Студ. VLAN", ic: "wifi", x: 22, y: 58, role: "hop", vuln: true, issue: "Выход в серверную" },
        { id: "teach", name: "Учителя", ic: "laptop", x: 78, y: 58, role: "hop", safe: true },
        { id: "1c", name: "1С", ic: "server", x: 40, y: 82, role: "hop", vuln: true, issue: "Общая учётка" },
        { id: "core", name: "ЯДРО", ic: "shield", x: 72, y: 88, role: "core" },
      ],
      edges: [["net", "fw"], ["fw", "stud"], ["fw", "teach"], ["stud", "1c"], ["teach", "core"], ["1c", "core"]],
    },
  ];

  /* ---------- Логи: богаче пулы и шаблоны ---------- */
  const usersOk = [
    "a.petrov", "m.ivanova", "s.orlov", "e.smirnova", "k.volkov", "n.kozlov",
    "d.morozov", "l.sokolova", "p.novikov", "t.fedorova", "i.belov", "o.makarova",
  ];
  const usersBad = ["admin", "root", "backup", "guest", "test", "sa", "administrator", "support", "oracle", "postgres"];
  const ipsIn = [
    "10.0.1.14", "10.0.1.22", "10.0.1.31", "10.0.2.8", "192.168.10.5", "192.168.10.17",
    "10.0.3.44", "10.0.4.9", "192.168.20.3", "192.168.20.18", "172.16.0.12", "172.16.1.7",
  ];
  const ipsOut = [
    "203.0.113.7", "198.51.100.9", "45.133.1.88", "91.218.44.12", "185.220.101.3", "45.33.32.156",
    "77.88.55.77", "5.188.10.22", "194.87.92.11", "31.13.72.4", "104.244.42.1", "89.44.12.90",
  ];

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function rnd(a) {
    return a[Math.floor(Math.random() * a.length)];
  }
  function dayTime() {
    const h = 8 + Math.floor(Math.random() * 10);
    const m = Math.floor(Math.random() * 60);
    return pad2(h) + ":" + pad2(m);
  }
  function nightTime() {
    const h = Math.random() < 0.5 ? Math.floor(Math.random() * 5) : 22 + Math.floor(Math.random() * 2);
    const m = Math.floor(Math.random() * 60);
    return pad2(h) + ":" + pad2(m);
  }

  B.makeLogs = function (total) {
    total = total || 8;
    const badCount = 3 + Math.floor(Math.random() * 2);
    const lines = [];
    const templatesBad = [
      () => ({ t: nightTime(), u: rnd(usersBad), ip: rnd(ipsOut), st: "OK", bad: true, why: "Привилегированный аккаунт ночью с внешнего IP" }),
      () => ({ t: dayTime(), u: rnd(usersOk), ip: rnd(ipsOut), st: "FAIL×" + (8 + Math.floor(Math.random() * 10)), bad: true, why: "Серия неудач с внешнего IP — подбор пароля" }),
      () => ({ t: nightTime(), u: rnd(usersOk), ip: rnd(ipsOut), st: "OK", bad: true, why: "Ночной вход с внешнего адреса" }),
      () => ({ t: dayTime(), u: "root", ip: rnd(ipsIn), st: "FAIL×" + (3 + Math.floor(Math.random() * 6)), bad: true, why: "Попытки входа под root" }),
      () => ({ t: nightTime(), u: "backup", ip: rnd(ipsOut), st: "OK", bad: true, why: "Сервисный аккаунт из чужой сети" }),
      () => ({ t: nightTime(), u: "sa", ip: rnd(ipsOut), st: "OK", bad: true, why: "Учётка БД с внешнего IP" }),
      () => ({ t: dayTime(), u: rnd(usersOk), ip: rnd(ipsOut), st: "OK", bad: true, why: "Успешный вход сразу после серии FAIL" }),
      () => ({ t: nightTime(), u: "administrator", ip: rnd(ipsIn), st: "FAIL×12", bad: true, why: "Перебор пароля локального администратора ночью" }),
      () => ({ t: dayTime(), u: "guest", ip: rnd(ipsOut), st: "OK", bad: true, why: "Гостевой вход с интернета" }),
    ];
    for (let i = 0; i < badCount; i++) lines.push(rnd(templatesBad)());
    while (lines.length < total) {
      lines.push({ t: dayTime(), u: rnd(usersOk), ip: rnd(ipsIn), st: "OK", bad: false });
    }
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = lines[i];
      lines[i] = lines[j];
      lines[j] = tmp;
    }
    return lines;
  };

  /* Подписи источников для карты атак */
  B.attackLabels = [
    "C2-ботнет", "Сканер портов", "Брутфорс RDP", "Фишинг-шлюз", "DDoS-узел",
    "Эксплойт-kit", "Криптомайнер", "Tor exit", "Spam-реле", "SQL-сканер",
    "XSS-ферма", "IoT-зомби", "Proxy-ферма", "Stealер", "Руткит-C2",
    "DNS-туннель", "Вайпер", "Worm-узел", "APT-зонд", "Кардер-шлюз",
  ];

  B.patchVulns = [
    "SQL-инъекция", "XSS-уязвимость", "Открытый порт 445", "Слабый пароль", "Устаревший TLS",
    "RCE в сервисе", "Нет 2FA", "CSRF-дыра", "Открытый Redis", "Default credentials",
    "Path traversal", "XXE в парсере", "SSRF к метаданным", "Deserialization RCE",
    "Непропатченный OpenSSL", "Открытый Elasticsearch", "IDOR в API", "Залитые секреты в git",
    "Устаревший WordPress", "Отключённый ASLR",
  ];
  B.patchSafes = [
    "Патч установлен", "Антивирус в норме", "Бэкап готов", "WAF активен", "2FA включена",
    "TLS 1.3 ok", "ACL проверен", "Журналы пишутся", "Диск зашифрован",
  ];
})();
