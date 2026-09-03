<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>الشات العالمي - غرف ورتب وصوت</title>
  <link rel="stylesheet" href="style.css">
  <!-- جلب المكتبات عبر CDN لضمان الاستقرار -->
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
</head>
<body>
  <div class="app">
    <!-- الشريط الجانبي -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>الغرف</h2>
        <button id="create-room-btn" class="btn btn-small">+ غرفة جديدة</button>
      </div>
      <div id="rooms-list" class="rooms-list"></div>
      
      <div class="sidebar-section">
        <h3>المستخدمون في الغرفة</h3>
        <div id="users-list" class="users-list"></div>
      </div>
    </aside>

    <!-- منطقة الشات الرئيسية -->
    <main class="main">
      <div class="room-header">
        <h1 id="current-room-name">الغرفة العامة</h1>
        <div class="user-info">
          <span id="username-display"></span>
          <span id="role-badge" class="role-badge"></span>
          <button id="voice-toggle" class="btn btn-small">🎤 تفعيل الصوت</button>
          <button id="leave-room-btn" class="btn btn-small btn-danger">مغادرة</button>
        </div>
      </div>

      <div id="messages" class="messages"></div>

      <div class="message-input">
        <input type="text" id="message-input" placeholder="اكتب رسالتك هنا..." />
        <button id="send-btn" class="btn">إرسال</button>
      </div>
    </main>
  </div>

  <!-- نافذة تسجيل الدخول -->
  <div id="login-modal" class="modal">
    <div class="modal-content">
      <h2>الانضمام إلى الشات</h2>
      <input type="text" id="username-input" placeholder="اسم المستخدم" />
      <select id="room-select">
        <option value="general">الغرفة العامة</option>
      </select>
      <button id="join-btn" class="btn">انضمام</button>
    </div>
  </div>

  <script src="client.js"></script>
</body>
</html>
