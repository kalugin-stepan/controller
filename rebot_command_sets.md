<h1>Набор команд</h1>

<h3>Команды сервера</h3>

<ul>
    <li><strong>topic:</strong> '${uid}:p', <strong>value:</strong> '{"X": 0, "Y": 0}' - координаты направления движения (X ∈ [-100; 100], Y ∈ [-100; 100])</li>
    <li><strong>topic:</strong> '${uid}:c', <strong>value:</strong> '1'/'0' - ответ на запрос подключения</li>
    <li><strong>topic:</strong> '${uid}:ping', <strong>value:</strong> '3430deab-320c-4d5b-ace1-9d8efe0b4363' - проверка соеденения</li>
</ul>

<h3>Команды клиента</h3>

<ul>
    <li><strong>topic:</strong> 'connection', <strong>value:</strong> '3430deab-320c-4d5b-ace1-9d8efe0b4363' - запрос подключения</li>
    <li><strong>topic:</strong> 'ping', <strong>value:</strong> '3430deab-320c-4d5b-ace1-9d8efe0b4363' - проверка соеденения</li>
</ul>
