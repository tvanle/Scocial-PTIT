import { PrismaClient, Gender, PostPrivacy, NotificationType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const hashedPassword = await bcrypt.hash('Test@1234', 12);

  // ============== USERS ==============
  const usersData = [
    {
      email: 'vanlee@ptit.edu.vn',
      studentId: 'B21DCCN001',
      fullName: 'Trần Văn Lê',
      bio: 'Developer | PTIT Student | Yêu công nghệ 💻',
      gender: Gender.MALE,
      avatar: 'https://i.pravatar.cc/300?img=1',
      isVerified: true,
    },
    {
      email: 'nguyenha@ptit.edu.vn',
      studentId: 'B21DCCN002',
      fullName: 'Nguyễn Thu Hà',
      bio: 'UI/UX Designer | Thích vẽ và thiết kế 🎨',
      gender: Gender.FEMALE,
      avatar: 'https://i.pravatar.cc/300?img=5',
      isVerified: true,
    },
    {
      email: 'trungkien@ptit.edu.vn',
      studentId: 'B21DCCN003',
      fullName: 'Phạm Trung Kiên',
      bio: 'Backend Developer | Java & Spring Boot enthusiast ☕',
      gender: Gender.MALE,
      avatar: 'https://i.pravatar.cc/300?img=3',
      isVerified: true,
    },
    {
      email: 'minhchau@ptit.edu.vn',
      studentId: 'B21DCCN004',
      fullName: 'Lê Minh Châu',
      bio: 'Data Science | AI/ML | Kaggle competitor 🤖',
      gender: Gender.FEMALE,
      avatar: 'https://i.pravatar.cc/300?img=9',
      isVerified: true,
    },
    {
      email: 'ducmanh@ptit.edu.vn',
      studentId: 'B21DCCN005',
      fullName: 'Hoàng Đức Mạnh',
      bio: 'Mobile Developer | React Native & Flutter 📱',
      gender: Gender.MALE,
      avatar: 'https://i.pravatar.cc/300?img=7',
      isVerified: true,
    },
    {
      email: 'thuylinh@ptit.edu.vn',
      studentId: 'B22DCCN006',
      fullName: 'Vũ Thùy Linh',
      bio: 'Frontend Dev | React & Next.js | Coffee lover ☕',
      gender: Gender.FEMALE,
      avatar: 'https://i.pravatar.cc/300?img=10',
      isVerified: false,
    },
    {
      email: 'quanghuy@ptit.edu.vn',
      studentId: 'B22DCCN007',
      fullName: 'Đỗ Quang Huy',
      bio: 'DevOps | Docker & K8s | Cloud enthusiast ☁️',
      gender: Gender.MALE,
      avatar: 'https://i.pravatar.cc/300?img=11',
      isVerified: true,
    },
    {
      email: 'phuongthao@ptit.edu.vn',
      studentId: 'B22DCCN008',
      fullName: 'Ngô Phương Thảo',
      bio: 'Cybersecurity | CTF player | Bug bounty hunter 🔒',
      gender: Gender.FEMALE,
      avatar: 'https://i.pravatar.cc/300?img=20',
      isVerified: false,
    },
    {
      email: 'anhtuan@ptit.edu.vn',
      studentId: 'B22DCCN009',
      fullName: 'Bùi Anh Tuấn',
      bio: 'Game Developer | Unity & Unreal Engine 🎮',
      gender: Gender.MALE,
      avatar: 'https://i.pravatar.cc/300?img=12',
      isVerified: false,
    },
    {
      email: 'hoangyen@ptit.edu.vn',
      studentId: 'B22DCCN010',
      fullName: 'Trần Hoàng Yến',
      bio: 'Graphic Design | Photography | Travel 📸',
      gender: Gender.FEMALE,
      avatar: 'https://i.pravatar.cc/300?img=25',
      isVerified: true,
    },
    {
      email: 'minhquan@ptit.edu.vn',
      studentId: 'B21DCAT011',
      fullName: 'Lý Minh Quân',
      bio: 'Embedded Systems | IoT | Arduino & ESP32',
      gender: Gender.MALE,
      avatar: 'https://i.pravatar.cc/300?img=14',
      isVerified: false,
    },
    {
      email: 'thanhnga@ptit.edu.vn',
      studentId: 'B21DCAT012',
      fullName: 'Đinh Thanh Nga',
      bio: 'Project Manager | Agile & Scrum | PTIT Club Leader',
      gender: Gender.FEMALE,
      avatar: 'https://i.pravatar.cc/300?img=32',
      isVerified: true,
    },
    {
      email: 'viethoang@ptit.edu.vn',
      studentId: 'B22DCAT013',
      fullName: 'Nguyễn Việt Hoàng',
      bio: 'Blockchain | Web3 | Solidity Developer',
      gender: Gender.MALE,
      avatar: 'https://i.pravatar.cc/300?img=15',
      isVerified: false,
    },
    {
      email: 'ngoclan@ptit.edu.vn',
      studentId: 'B22DCAT014',
      fullName: 'Phan Ngọc Lan',
      bio: 'Content Creator | Marketing | Social Media 📝',
      gender: Gender.FEMALE,
      avatar: 'https://i.pravatar.cc/300?img=33',
      isVerified: false,
    },
    {
      email: 'haidang@ptit.edu.vn',
      studentId: 'B23DCCN015',
      fullName: 'Trịnh Hải Đăng',
      bio: 'Freshman | Learning to code | Python & C++ 🐍',
      gender: Gender.MALE,
      avatar: 'https://i.pravatar.cc/300?img=16',
      isVerified: false,
    },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        ...u,
        password: hashedPassword,
        isEmailVerified: true,
        isActive: true,
        lastActiveAt: new Date(),
      },
    });
    users.push(user);
  }
  console.log(`✅ Created ${users.length} users`);

  // ============== FOLLOWS ==============
  const followPairs = [
    [0, 1], [0, 2], [0, 3], [0, 4], [0, 6], [0, 9], [0, 11],
    [1, 0], [1, 2], [1, 3], [1, 5], [1, 9], [1, 11],
    [2, 0], [2, 1], [2, 4], [2, 6], [2, 7],
    [3, 0], [3, 1], [3, 2], [3, 7], [3, 12],
    [4, 0], [4, 1], [4, 2], [4, 3], [4, 5], [4, 8],
    [5, 0], [5, 1], [5, 4], [5, 6], [5, 9],
    [6, 0], [6, 2], [6, 3], [6, 7], [6, 10],
    [7, 0], [7, 3], [7, 6], [7, 12],
    [8, 0], [8, 4], [8, 14],
    [9, 0], [9, 1], [9, 5], [9, 11], [9, 13],
    [10, 0], [10, 2], [10, 6],
    [11, 0], [11, 1], [11, 3], [11, 9],
    [12, 0], [12, 3], [12, 7],
    [13, 0], [13, 1], [13, 9], [13, 11],
    [14, 0], [14, 4], [14, 8],
  ];

  for (const [a, b] of followPairs) {
    await prisma.follow.create({
      data: { followerId: users[a].id, followingId: users[b].id },
    });
  }
  console.log(`✅ Created ${followPairs.length} follows`);

  // ============== POSTS ==============
  const postsData = [
    // User 0 - Trần Văn Lê
    { authorIdx: 0, content: 'Vừa hoàn thành project React Native cho môn Phát triển ứng dụng di động. Cảm giác khi app chạy mượt trên cả iOS và Android thật sự rất sướng! 🚀📱', daysAgo: 0.1 },
    { authorIdx: 0, content: 'Mọi người có biết cách optimize performance cho FlatList khi render nhiều item không? Đang bị lag khi scroll nhanh 😅', daysAgo: 1 },
    { authorIdx: 0, content: 'Tips cho các bạn mới học React Native:\n1. Nắm vững React trước\n2. Hiểu Flexbox layout\n3. Dùng TypeScript từ đầu\n4. Expo là bạn tốt nhất\n5. Đọc docs trước khi Google 📖', daysAgo: 3 },

    // User 1 - Nguyễn Thu Hà
    { authorIdx: 1, content: 'Vừa redesign xong giao diện app PTIT Social theo Material Design 3. Mọi người thấy thế nào? Feedback giúp mình nhé! 🎨✨', daysAgo: 0.2 },
    { authorIdx: 1, content: 'Chia sẻ bộ color palette mình hay dùng cho dark mode:\n- Background: #121212\n- Surface: #1E1E1E\n- Primary: #BB86FC\n- Error: #CF6679\nHy vọng hữu ích cho mọi người! 🌙', daysAgo: 2 },
    { authorIdx: 1, content: 'Figma hay Sketch? Mình team Figma vì collaborate real-time quá tiện. Ai dùng Sketch thì cho mình biết ưu điểm với 🤔', daysAgo: 5 },

    // User 2 - Phạm Trung Kiên
    { authorIdx: 2, content: 'Spring Boot 3.2 vừa release, hỗ trợ virtual threads ngon rồi. Performance test thấy throughput tăng 3x so với thread pool truyền thống! 🔥', daysAgo: 0.3 },
    { authorIdx: 2, content: 'Hôm nay debug cái bug production 4 tiếng, cuối cùng lỗi ở chỗ thiếu @Transactional. Bài học: đừng bao giờ skip code review 😂', daysAgo: 1.5 },
    { authorIdx: 2, content: 'So sánh nhanh:\n🟢 PostgreSQL: ACID, complex queries\n🔵 MongoDB: Flexible schema, horizontal scale\n🟡 Redis: Cache, real-time\n\nChọn đúng tool cho đúng việc, đừng dùng 1 cái cho tất cả nhé!', daysAgo: 4 },

    // User 3 - Lê Minh Châu
    { authorIdx: 3, content: 'Vừa train xong model phân loại ảnh cho đồ án tốt nghiệp. Accuracy 94.7% trên test set! Dùng ResNet50 + transfer learning + data augmentation 🤖📊', daysAgo: 0.5 },
    { authorIdx: 3, content: 'Free resources cho ai muốn học ML/AI:\n- fast.ai (best for beginners)\n- Andrew Ng Coursera\n- Kaggle Learn\n- Papers With Code\n- Hugging Face courses\nĐừng quên practice trên Kaggle nhé! 📚', daysAgo: 2.5 },
    { authorIdx: 3, content: 'ChatGPT hay Claude? Mình dùng cả 2 nhưng Claude cho coding thì ngon hơn hẳn. Ai có trải nghiệm khác không? 🤔', daysAgo: 6 },

    // User 4 - Hoàng Đức Mạnh
    { authorIdx: 4, content: 'Flutter 3.19 support Impeller engine trên Android rồi! Render smooth hơn nhiều, nhất là animations phức tạp 🎯', daysAgo: 0.4 },
    { authorIdx: 4, content: 'Đang phân vân giữa React Native và Flutter cho project mới. RN thì ecosystem lớn, Flutter thì performance tốt hơn. Mọi người vote giúp! 📱', daysAgo: 3 },

    // User 5 - Vũ Thùy Linh
    { authorIdx: 5, content: 'Next.js 15 App Router đã stable! Server Components thay đổi cách mình nghĩ về React hoàn toàn. Ai chưa thử thì nên bắt đầu ngay 🚀', daysAgo: 0.6 },
    { authorIdx: 5, content: 'Tailwind CSS tips:\n- Dùng @apply cho repeated styles\n- Custom theme trong tailwind.config\n- Group hover: group-hover:text-blue-500\n- Container queries mới: @container\nCSS chưa bao giờ dễ đến thế! 💅', daysAgo: 2 },
    { authorIdx: 5, content: 'Weekend coding session tại Highland Coffee ☕ Ai ở gần PTIT muốn join code cùng không? Mình đang làm side project e-commerce 🛒', daysAgo: 4 },

    // User 6 - Đỗ Quang Huy
    { authorIdx: 6, content: 'CI/CD pipeline hoàn chỉnh với GitHub Actions:\n1. Lint & Test\n2. Build Docker image\n3. Push to ECR\n4. Deploy to EKS\n\nTự động hoá mọi thứ, deploy chỉ cần merge PR! 🐳', daysAgo: 0.7 },
    { authorIdx: 6, content: 'Kubernetes cheat sheet cho newbie:\n- kubectl get pods\n- kubectl logs <pod>\n- kubectl describe pod <pod>\n- kubectl exec -it <pod> -- /bin/sh\nBookmark lại dùng dần nhé! ☸️', daysAgo: 3 },

    // User 7 - Ngô Phương Thảo
    { authorIdx: 7, content: 'Vừa tìm được SQL Injection trên 1 website thực tế (đã report responsible disclosure). Các bạn dev nhớ dùng prepared statements nhé, đừng bao giờ concatenate raw input! 🔒', daysAgo: 0.8 },
    { authorIdx: 7, content: 'CTF writeup: Giải được challenge crypto cuối cùng trong PTIT CTF 2025. Dùng padding oracle attack + custom script Python. Sẽ viết blog chi tiết sau! 🏆', daysAgo: 2 },

    // User 8 - Bùi Anh Tuấn
    { authorIdx: 8, content: 'Demo game Unity đầu tiên! 2D platformer với pixel art tự vẽ. Tuy đơn giản nhưng mất 2 tháng mới xong 😄 Link demo trong comment nhé 🎮', daysAgo: 1 },
    { authorIdx: 8, content: 'Shader programming trong Unity thật sự rất thú vị. Từ một plane đơn giản có thể tạo ra water effect cực đẹp chỉ với vài dòng HLSL code ✨🌊', daysAgo: 5 },

    // User 9 - Trần Hoàng Yến
    { authorIdx: 9, content: 'Chụp ảnh sự kiện TEDxPTIT hôm nay 📸 Các speaker chia sẻ rất hay về AI và tương lai của giáo dục. Album full sẽ up sau nhé!', daysAgo: 0.3 },
    { authorIdx: 9, content: 'Tips chụp ảnh sản phẩm bằng điện thoại:\n1. Ánh sáng tự nhiên > flash\n2. Background đơn giản\n3. Rule of thirds\n4. Edit nhẹ nhàng, đừng over-filter\n5. Chụp nhiều góc rồi chọn 📱📸', daysAgo: 3 },

    // User 10 - Lý Minh Quân
    { authorIdx: 10, content: 'Project IoT Smart Home hoàn thành! ESP32 + MQTT + React Native app. Điều khiển đèn, quạt, nhiệt độ từ xa. Chi phí chỉ ~500k cho toàn bộ hardware 🏠💡', daysAgo: 1 },
    { authorIdx: 10, content: 'Ai đang học Embedded Systems thì recommend cuốn "Making Embedded Systems" của Elecia White. Rất practical và dễ hiểu, khác hẳn giáo trình trường 📖', daysAgo: 4 },

    // User 11 - Đinh Thanh Nga
    { authorIdx: 11, content: '📢 Thông báo: CLB Tin học PTIT tuyển thành viên mới!\n- Web Development\n- Mobile App\n- AI/ML\n- Cybersecurity\n\nĐăng ký tại link bio. Deadline: cuối tuần này! 🎯', daysAgo: 0.2 },
    { authorIdx: 11, content: 'Scrum Master tips: Daily standup không phải để báo cáo cho PM, mà để team sync với nhau. Giữ ngắn gọn: Yesterday, Today, Blockers. Đừng biến nó thành meeting dài! ⏱️', daysAgo: 2 },
    { authorIdx: 11, content: 'Hackathon PTIT 2025 sắp diễn ra! Năm nay theme là "AI for Education". Giải nhất 20 triệu 💰 Ai muốn lập team thì comment bên dưới nhé!', daysAgo: 5 },

    // User 12 - Nguyễn Việt Hoàng
    { authorIdx: 12, content: 'Smart contract đầu tiên deploy lên Ethereum testnet thành công! Solidity thật sự không khó như mọi người nghĩ, khó là ở security 🔗', daysAgo: 1.5 },
    { authorIdx: 12, content: 'Web3 không chết, nó chỉ đang mature. DeFi, NFT utility, DAOs - nhiều use case thực tế đang phát triển. Đừng bỏ qua blockchain chỉ vì crypto bear market 📈', daysAgo: 4 },

    // User 13 - Phan Ngọc Lan
    { authorIdx: 13, content: 'Vừa đạt 10k followers trên TikTok với content về "Cuộc sống sinh viên IT" 🎉 Cảm ơn mọi người đã ủng hộ! Sắp tới sẽ làm series "Debug cuộc đời" 😂', daysAgo: 0.5 },
    { authorIdx: 13, content: 'Marketing digital cho sinh viên:\n- Canva cho design\n- CapCut cho video\n- ChatGPT cho copywriting\n- Google Analytics cho tracking\n\nBộ công cụ miễn phí mà hiệu quả! 📊', daysAgo: 3 },

    // User 14 - Trịnh Hải Đăng
    { authorIdx: 14, content: 'Năm nhất mới vào PTIT, mọi thứ đều mới lạ. Anh chị nào có tips học tập và cuộc sống ở đây cho em với! 🙏', daysAgo: 0.8 },
    { authorIdx: 14, content: 'Vừa giải xong 100 bài LeetCode Easy! Cảm giác từ không biết gì đến tự giải được bài medium thật sự rất motivating 💪 Tiếp tục chiến thôi!', daysAgo: 2 },
    { authorIdx: 14, content: 'Hôm nay học được recursion và cuối cùng cũng hiểu! Trick: nghĩ base case trước, rồi mới nghĩ recursive case. Đừng cố trace toàn bộ call stack trong đầu 🧠', daysAgo: 6 },
  ];

  const posts = [];
  for (const p of postsData) {
    const createdAt = new Date(Date.now() - p.daysAgo * 24 * 60 * 60 * 1000);
    const post = await prisma.post.create({
      data: {
        content: p.content,
        authorId: users[p.authorIdx].id,
        privacy: PostPrivacy.PUBLIC,
        createdAt,
        updatedAt: createdAt,
      },
    });
    posts.push(post);
  }
  console.log(`✅ Created ${posts.length} posts`);

  // ============== COMMENTS ==============
  const commentsData = [
    // Comments on post 0 (Văn Lê - RN project)
    { postIdx: 0, authorIdx: 4, content: 'Ngon quá bro! Share source code được không? 😄' },
    { postIdx: 0, authorIdx: 1, content: 'UI đẹp lắm, design system rõ ràng 👏' },
    { postIdx: 0, authorIdx: 5, content: 'React Native ftw! Expo hay bare workflow vậy?' },
    { postIdx: 0, authorIdx: 14, content: 'Em mới học RN, anh có recommend tài liệu gì không ạ?' },

    // Comments on post 1 (Văn Lê - FlatList performance)
    { postIdx: 1, authorIdx: 2, content: 'Thử dùng FlashList thay FlatList đi, performance tốt hơn nhiều!' },
    { postIdx: 1, authorIdx: 4, content: 'windowSize={5} và removeClippedSubviews={true} thử chưa?' },
    { postIdx: 1, authorIdx: 6, content: 'Memo component + useCallback cho renderItem nhé' },

    // Comments on post 3 (Thu Hà - redesign)
    { postIdx: 3, authorIdx: 0, content: 'Đẹp quá! Màu sắc hài hoà lắm 😍' },
    { postIdx: 3, authorIdx: 9, content: 'Typography rất clean! Font gì vậy bạn?' },
    { postIdx: 3, authorIdx: 5, content: 'Material Design 3 dynamic color cool ghê!' },

    // Comments on post 6 (Trung Kiên - Spring Boot)
    { postIdx: 6, authorIdx: 0, content: 'Virtual threads game changer thật sự!' },
    { postIdx: 6, authorIdx: 6, content: 'Kết hợp với GraalVM native image nữa thì startup time cũng nhanh luôn 🚀' },

    // Comments on post 7 (Trung Kiên - debug bug)
    { postIdx: 7, authorIdx: 3, content: 'Cảm giác tìm được bug sau nhiều giờ debug... priceless 😂' },
    { postIdx: 7, authorIdx: 7, content: 'IDE warning mà skip thì đừng blame code 😏' },
    { postIdx: 7, authorIdx: 11, content: 'Code review không phải để soi lỗi, mà để học từ nhau 👍' },

    // Comments on post 9 (Minh Châu - ML model)
    { postIdx: 9, authorIdx: 2, content: '94.7% impressive! Dataset bao nhiêu sample vậy?' },
    { postIdx: 9, authorIdx: 12, content: 'Thử fine-tune với ViT xem, có khi accuracy cao hơn' },
    { postIdx: 9, authorIdx: 0, content: 'Siêu ghê! Deploy lên đâu vậy?' },

    // Comments on post 14 (Thùy Linh - Next.js)
    { postIdx: 14, authorIdx: 0, content: 'Server Components + Streaming SSR = combo siêu mạnh!' },
    { postIdx: 14, authorIdx: 2, content: 'RSC mindset khác hẳn CSR, phải unlearn nhiều thứ 😅' },

    // Comments on post 17 (Quang Huy - CI/CD)
    { postIdx: 17, authorIdx: 2, content: 'Terraform cho IaC nữa thì perfect!' },
    { postIdx: 17, authorIdx: 0, content: 'GitHub Actions free 2000 minutes/month ngon quá 💰' },

    // Comments on post 19 (Phương Thảo - SQLi)
    { postIdx: 19, authorIdx: 6, content: 'Responsible disclosure 👏 Respect!' },
    { postIdx: 19, authorIdx: 2, content: 'ORM cũng giúp prevent SQLi, nhưng raw query vẫn phải cẩn thận' },

    // Comments on post 22 (Hoàng Yến - TEDx)
    { postIdx: 22, authorIdx: 1, content: 'Hôm đó hay lắm! Speaker về AI trong y tế rất inspiring' },
    { postIdx: 22, authorIdx: 11, content: 'Năm sau CLB mình sẽ tổ chức lớn hơn nữa! 🎉' },
    { postIdx: 22, authorIdx: 13, content: 'Mình có quay video, sẽ edit up YouTube sớm nhé!' },

    // Comments on post 26 (Thanh Nga - CLB tuyển thành viên)
    { postIdx: 26, authorIdx: 14, content: 'Em đăng ký mảng Web Development ạ! 🙋‍♂️' },
    { postIdx: 26, authorIdx: 5, content: 'Năm ngoái join CLB học được rất nhiều, recommend mọi người!' },
    { postIdx: 26, authorIdx: 8, content: 'Có mảng Game Dev không chị? 🎮' },
    { postIdx: 26, authorIdx: 0, content: 'CLB tuyệt vời lắm, ai mới vào nên join sớm!' },

    // Comments on post 28 (Thanh Nga - Hackathon)
    { postIdx: 28, authorIdx: 0, content: 'Count me in! Ai muốn cùng team message mình nhé 🙋' },
    { postIdx: 28, authorIdx: 3, content: 'AI for Education, topic rất hay! Mình join!' },
    { postIdx: 28, authorIdx: 4, content: 'Team 4 người được không chị?' },
    { postIdx: 28, authorIdx: 12, content: 'Kết hợp AI + Blockchain cho education platform? 🤔' },

    // Comments on post 33 (Hải Đăng - năm nhất)
    { postIdx: 33, authorIdx: 0, content: 'Chào em! Tips: tham gia CLB sớm, học thêm ngoài giáo trình, và đừng ngại hỏi anh chị khoá trên nhé! 💪' },
    { postIdx: 33, authorIdx: 1, content: 'Học Git/GitHub sớm, rất cần cho làm việc nhóm!' },
    { postIdx: 33, authorIdx: 11, content: 'Join CLB Tin học đi em, sẽ hướng dẫn từ đầu!' },
    { postIdx: 33, authorIdx: 4, content: 'Năm nhất focus vào C/C++ và DSA nhé, nền tảng rất quan trọng!' },
    { postIdx: 33, authorIdx: 7, content: 'Đừng quên học English nữa, tài liệu IT chủ yếu tiếng Anh!' },

    // Comments on post 34 (Hải Đăng - LeetCode)
    { postIdx: 34, authorIdx: 2, content: '100 bài là achievement lớn đấy! Keep going! 🔥' },
    { postIdx: 34, authorIdx: 3, content: 'Tip: sau Easy thì làm top 100 liked Medium, rất hay!' },
  ];

  for (const c of commentsData) {
    const post = posts[c.postIdx];
    await prisma.comment.create({
      data: {
        content: c.content,
        authorId: users[c.authorIdx].id,
        postId: post.id,
      },
    });
  }
  console.log(`✅ Created ${commentsData.length} comments`);

  // ============== LIKES ==============
  // Each post gets random likes from various users
  const likesSet = new Set<string>();
  const likePatterns: [number, number[]][] = [
    [0, [1, 2, 3, 4, 5, 6, 9, 11, 14]], // Post 0 gets 9 likes
    [1, [2, 4, 5, 6]],
    [2, [1, 3, 4, 5, 7, 14]],
    [3, [0, 2, 5, 9, 11, 13]],
    [4, [0, 3, 5, 6]],
    [5, [0, 3, 9]],
    [6, [0, 1, 4, 6, 10]],
    [7, [0, 1, 3, 7, 11, 14]],
    [8, [0, 1, 3, 6, 10]],
    [9, [0, 1, 2, 5, 7, 11, 12, 14]],
    [10, [0, 2, 3, 7, 12]],
    [11, [0, 1, 2, 3, 4, 9, 10]],
    [12, [0, 1, 4, 5]],
    [13, [0, 1, 2, 5, 8]],
    [14, [0, 1, 2, 4, 6]],
    [15, [0, 1, 4, 9]],
    [16, [0, 1, 5, 9, 13]],
    [17, [0, 2, 3, 7, 10]],
    [18, [0, 2, 6, 10]],
    [19, [0, 2, 3, 6, 11, 12]],
    [20, [0, 3, 6, 7]],
    [21, [0, 4, 8, 14]],
    [22, [0, 1, 3, 5, 11, 13, 14]],
    [23, [0, 1, 9, 13]],
    [24, [0, 2, 6, 10]],
    [25, [0, 2, 4, 6, 10, 14]],
    [26, [0, 1, 4, 5, 8, 9, 14]],
    [27, [0, 1, 3, 9]],
    [28, [0, 1, 2, 3, 4, 5, 12, 14]],
    [29, [0, 3, 7, 12]],
    [30, [0, 3, 12]],
    [31, [0, 1, 9, 11]],
    [32, [0, 1, 9, 11, 14]],
    [33, [0, 1, 2, 4, 5, 7, 8, 9, 11]],
    [34, [0, 2, 3, 4, 11]],
    [35, [0, 2, 4]],
  ];

  let likesCount = 0;
  for (const [postIdx, userIdxs] of likePatterns) {
    if (postIdx >= posts.length) continue;
    for (const userIdx of userIdxs) {
      const key = `${posts[postIdx].id}-${users[userIdx].id}`;
      if (likesSet.has(key)) continue;
      likesSet.add(key);
      await prisma.like.create({
        data: {
          postId: posts[postIdx].id,
          userId: users[userIdx].id,
        },
      });
      likesCount++;
    }
  }
  console.log(`✅ Created ${likesCount} likes`);

  // ============== SHARES (REPOSTS) ==============
  const sharePatterns: [number, number[]][] = [
    [2, [1, 4, 5, 14]],     // Tips RN post shared by 4 people
    [9, [0, 2, 7]],          // ML model post
    [10, [0, 5, 14]],        // ML resources
    [17, [0, 2, 10]],        // CI/CD post
    [19, [2, 6, 12]],        // SQLi post
    [26, [0, 5, 9, 14]],     // CLB tuyển thành viên
    [28, [0, 3, 4, 12, 14]], // Hackathon
    [8, [0, 3, 6]],          // DB comparison
  ];

  let sharesCount = 0;
  for (const [postIdx, userIdxs] of sharePatterns) {
    for (const userIdx of userIdxs) {
      await prisma.share.create({
        data: {
          postId: posts[postIdx].id,
          userId: users[userIdx].id,
        },
      });
      sharesCount++;
    }
  }
  console.log(`✅ Created ${sharesCount} shares`);

  // ============== NOTIFICATIONS ==============
  const notifications: { type: NotificationType; senderIdx: number; receiverIdx: number; refPostIdx?: number }[] = [
    { type: 'LIKE', senderIdx: 1, receiverIdx: 0, refPostIdx: 0 },
    { type: 'LIKE', senderIdx: 2, receiverIdx: 0, refPostIdx: 0 },
    { type: 'LIKE', senderIdx: 4, receiverIdx: 0, refPostIdx: 1 },
    { type: 'COMMENT', senderIdx: 4, receiverIdx: 0, refPostIdx: 0 },
    { type: 'COMMENT', senderIdx: 1, receiverIdx: 0, refPostIdx: 0 },
    { type: 'COMMENT', senderIdx: 14, receiverIdx: 0, refPostIdx: 0 },
    { type: 'FOLLOW', senderIdx: 1, receiverIdx: 0 },
    { type: 'FOLLOW', senderIdx: 3, receiverIdx: 0 },
    { type: 'FOLLOW', senderIdx: 14, receiverIdx: 0 },
    { type: 'LIKE', senderIdx: 0, receiverIdx: 1, refPostIdx: 3 },
    { type: 'COMMENT', senderIdx: 0, receiverIdx: 1, refPostIdx: 3 },
    { type: 'FOLLOW', senderIdx: 0, receiverIdx: 1 },
    { type: 'LIKE', senderIdx: 0, receiverIdx: 2, refPostIdx: 6 },
    { type: 'COMMENT', senderIdx: 6, receiverIdx: 2, refPostIdx: 6 },
    { type: 'LIKE', senderIdx: 0, receiverIdx: 3, refPostIdx: 9 },
    { type: 'LIKE', senderIdx: 0, receiverIdx: 11, refPostIdx: 26 },
    { type: 'COMMENT', senderIdx: 14, receiverIdx: 11, refPostIdx: 26 },
    { type: 'LIKE', senderIdx: 0, receiverIdx: 14, refPostIdx: 33 },
    { type: 'COMMENT', senderIdx: 0, receiverIdx: 14, refPostIdx: 33 },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        type: n.type,
        senderId: users[n.senderIdx].id,
        receiverId: users[n.receiverIdx].id,
        referenceId: n.refPostIdx !== undefined ? posts[n.refPostIdx].id : undefined,
      },
    });
  }
  console.log(`✅ Created ${notifications.length} notifications`);

  // ============== CONVERSATIONS ==============
  const conv1 = await prisma.conversation.create({
    data: {
      type: 'PRIVATE',
      participants: {
        create: [
          { userId: users[0].id },
          { userId: users[1].id },
        ],
      },
    },
  });

  const conv2 = await prisma.conversation.create({
    data: {
      type: 'PRIVATE',
      participants: {
        create: [
          { userId: users[0].id },
          { userId: users[4].id },
        ],
      },
    },
  });

  const conv3 = await prisma.conversation.create({
    data: {
      type: 'GROUP',
      name: 'Team Project PTIT Social',
      participants: {
        create: [
          { userId: users[0].id },
          { userId: users[1].id },
          { userId: users[2].id },
          { userId: users[4].id },
        ],
      },
    },
  });

  // Messages
  const messagesData = [
    { convId: conv1.id, senderIdx: 0, content: 'Hà ơi, design mới đẹp quá!' },
    { convId: conv1.id, senderIdx: 1, content: 'Cảm ơn anh! Có feedback gì không ạ?' },
    { convId: conv1.id, senderIdx: 0, content: 'Màu primary nên đậm hơn 1 chút, còn lại perfect rồi 👍' },
    { convId: conv1.id, senderIdx: 1, content: 'Ok anh, em sẽ adjust lại. Tối nay gửi bản mới nhé!' },

    { convId: conv2.id, senderIdx: 0, content: 'Mạnh, xong chưa phần navigation?' },
    { convId: conv2.id, senderIdx: 4, content: 'Đang làm, tối nay push code nhé' },
    { convId: conv2.id, senderIdx: 0, content: 'Ok, merge xong mình test luôn' },

    { convId: conv3.id, senderIdx: 0, content: 'Team ơi, deadline cuối tuần này nhé!' },
    { convId: conv3.id, senderIdx: 2, content: 'Backend API xong hết rồi, đang viết docs' },
    { convId: conv3.id, senderIdx: 1, content: 'UI cũng gần xong, còn 2 màn nữa' },
    { convId: conv3.id, senderIdx: 4, content: 'Mobile integration đang test, có vài bug nhỏ' },
    { convId: conv3.id, senderIdx: 0, content: 'Good! Tối nay họp sync 8h nhé mọi người 💪' },
  ];

  for (let i = 0; i < messagesData.length; i++) {
    const m = messagesData[i];
    const createdAt = new Date(Date.now() - (messagesData.length - i) * 30 * 60 * 1000);
    const msg = await prisma.message.create({
      data: {
        conversationId: m.convId,
        senderId: users[m.senderIdx].id,
        content: m.content,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Update last message on conversation
    if (i === 3 || i === 6 || i === 11) {
      await prisma.conversation.update({
        where: { id: m.convId },
        data: {
          lastMessageContent: m.content,
          lastMessageSenderId: users[m.senderIdx].id,
          lastMessageCreatedAt: createdAt,
        },
      });
    }
  }
  console.log(`✅ Created 3 conversations with ${messagesData.length} messages`);

  console.log('\n🎉 Seed completed!');
  console.log('📧 All accounts use password: Test@1234');
  console.log('👤 Main account: vanlee@ptit.edu.vn');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
