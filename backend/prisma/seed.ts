import { PrismaClient, Gender, PostPrivacy, FrequencyLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Vietnamese name data
const firstNamesMale = ['Văn', 'Minh', 'Đức', 'Hoàng', 'Quang', 'Anh', 'Hữu', 'Công', 'Tiến', 'Trung', 'Hùng', 'Dũng', 'Thành', 'Tuấn', 'Phúc', 'Bảo', 'Khang', 'Long', 'Nam', 'Hải'];
const firstNamesFemale = ['Thị', 'Ngọc', 'Thu', 'Hồng', 'Mai', 'Lan', 'Hương', 'Linh', 'Phương', 'Trang', 'Hà', 'Yến', 'Vy', 'Chi', 'My', 'Quỳnh', 'Như', 'Thảo', 'Nhi', 'Anh'];
const middleNames = ['Văn', 'Thị', 'Hữu', 'Minh', 'Quốc', 'Đình', 'Ngọc', 'Thanh', 'Xuân', 'Kim', 'Hoàng', 'Phương', 'Bảo', 'Gia', 'Hải'];
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];

const faculties = [
  'Công nghệ Thông tin 1',
  'Công nghệ Thông tin 2',
  'Điện tử Viễn thông',
  'An toàn Thông tin',
  'Công nghệ Đa phương tiện',
  'Kỹ thuật Điện tử',
  'Quản trị Kinh doanh',
  'Kế toán',
  'Marketing',
];

const classNames = ['D21CQCN01-N', 'D21CQCN02-N', 'D21CQCN03-N', 'D22CQCN01-N', 'D22CQCN02-N', 'D23CQCN01-N', 'D23CQCN02-N', 'D21CQAT01-N', 'D22CQAT01-N', 'D21CQVT01-N', 'D22CQVT01-N', 'D21CQDM01-N'];

const bios = [
  'Developer | PTIT Student | Yêu công nghệ 💻',
  'UI/UX Designer | Thích vẽ và thiết kế 🎨',
  'Backend Developer | Java & Spring Boot enthusiast ☕',
  'Data Science | AI/ML | Kaggle competitor 🤖',
  'Mobile Developer | React Native & Flutter 📱',
  'Frontend Dev | React & Next.js | Coffee lover ☕',
  'DevOps | Docker & K8s | Cloud enthusiast ☁️',
  'Cybersecurity | CTF player | Bug bounty hunter 🔒',
  'Game Developer | Unity & Unreal Engine 🎮',
  'Graphic Design | Photography | Travel 📸',
  'Embedded Systems | IoT | Arduino & ESP32',
  'Blockchain | Web3 | Solidity Developer',
  'Content Creator | Marketing | Social Media 📝',
  'Freshman | Learning to code | Python & C++ 🐍',
  'Full-stack Developer | Node.js & React',
  'AI Researcher | Deep Learning | PyTorch',
  'Product Manager | Agile & Scrum',
  'QA Engineer | Testing enthusiast',
  'Network Engineer | CCNA | Cloud',
  'Student | Dreamer | Coder',
];

const postContents = [
  'Vừa hoàn thành project React Native cho môn Phát triển ứng dụng di động. Cảm giác khi app chạy mượt trên cả iOS và Android thật sự rất sướng! 🚀📱',
  'Mọi người có biết cách optimize performance cho FlatList khi render nhiều item không? Đang bị lag khi scroll nhanh 😅',
  'Tips cho các bạn mới học React Native:\n1. Nắm vững React trước\n2. Hiểu Flexbox layout\n3. Dùng TypeScript từ đầu\n4. Expo là bạn tốt nhất\n5. Đọc docs trước khi Google 📖',
  'Spring Boot 3.2 vừa release, hỗ trợ virtual threads ngon rồi. Performance test thấy throughput tăng 3x so với thread pool truyền thống! 🔥',
  'Hôm nay debug cái bug production 4 tiếng, cuối cùng lỗi ở chỗ thiếu @Transactional. Bài học: đừng bao giờ skip code review 😂',
  'Vừa train xong model phân loại ảnh cho đồ án tốt nghiệp. Accuracy 94.7% trên test set! Dùng ResNet50 + transfer learning + data augmentation 🤖📊',
  'Free resources cho ai muốn học ML/AI:\n- fast.ai (best for beginners)\n- Andrew Ng Coursera\n- Kaggle Learn\n- Papers With Code\n- Hugging Face courses 📚',
  'Flutter 3.19 support Impeller engine trên Android rồi! Render smooth hơn nhiều, nhất là animations phức tạp 🎯',
  'Next.js 15 App Router đã stable! Server Components thay đổi cách mình nghĩ về React hoàn toàn. Ai chưa thử thì nên bắt đầu ngay 🚀',
  'CI/CD pipeline hoàn chỉnh với GitHub Actions:\n1. Lint & Test\n2. Build Docker image\n3. Push to ECR\n4. Deploy to EKS\n\nTự động hoá mọi thứ! 🐳',
  'Kubernetes cheat sheet cho newbie:\n- kubectl get pods\n- kubectl logs <pod>\n- kubectl describe pod <pod>\n- kubectl exec -it <pod> -- /bin/sh ☸️',
  'Vừa tìm được SQL Injection trên 1 website thực tế (đã report responsible disclosure). Các bạn dev nhớ dùng prepared statements nhé! 🔒',
  'CTF writeup: Giải được challenge crypto cuối cùng trong PTIT CTF 2025. Dùng padding oracle attack + custom script Python 🏆',
  'Demo game Unity đầu tiên! 2D platformer với pixel art tự vẽ. Tuy đơn giản nhưng mất 2 tháng mới xong 😄 🎮',
  'Chụp ảnh sự kiện TEDxPTIT hôm nay 📸 Các speaker chia sẻ rất hay về AI và tương lai của giáo dục!',
  'Project IoT Smart Home hoàn thành! ESP32 + MQTT + React Native app. Điều khiển đèn, quạt, nhiệt độ từ xa 🏠💡',
  '📢 Thông báo: CLB Tin học PTIT tuyển thành viên mới!\n- Web Development\n- Mobile App\n- AI/ML\n- Cybersecurity 🎯',
  'Hackathon PTIT 2025 sắp diễn ra! Năm nay theme là "AI for Education". Giải nhất 20 triệu 💰',
  'Smart contract đầu tiên deploy lên Ethereum testnet thành công! Solidity thật sự không khó như mọi người nghĩ 🔗',
  'Vừa đạt 10k followers trên TikTok với content về "Cuộc sống sinh viên IT" 🎉',
  'Năm nhất mới vào PTIT, mọi thứ đều mới lạ. Anh chị nào có tips học tập không ạ? 🙏',
  'Vừa giải xong 100 bài LeetCode Easy! Cảm giác từ không biết gì đến tự giải được bài medium thật sự rất motivating 💪',
  'Hôm nay học được recursion và cuối cùng cũng hiểu! Trick: nghĩ base case trước, rồi mới nghĩ recursive case 🧠',
  'Tailwind CSS tips:\n- Dùng @apply cho repeated styles\n- Custom theme trong tailwind.config\n- Group hover: group-hover:text-blue-500 💅',
  'Weekend coding session tại Highland Coffee ☕ Ai ở gần PTIT muốn join code cùng không?',
  'So sánh nhanh PostgreSQL vs MongoDB vs Redis - chọn đúng tool cho đúng việc! 🗄️',
  'Vừa pass phỏng vấn internship! Tips: chuẩn bị kỹ DSA + system design basics + làm nhiều project cá nhân 🎉',
  'Chia sẻ setup dev của mình: MacBook M2 + VS Code + iTerm2 + tmux. Mọi người dùng gì? 💻',
  'Git tips quan trọng:\n- Commit thường xuyên\n- Branch name rõ ràng\n- PR nhỏ và focused\n- Rebase trước merge',
  'Docker 101: Container hóa app Node.js chỉ với 10 dòng Dockerfile 🐳',
  'GraphQL vs REST API - khi nào dùng gì? Thread phân tích chi tiết 👇',
  'Vừa hoàn thành khóa học AWS Solutions Architect! Cloud là tương lai 🌩️',
  'Testing là quan trọng! Viết unit test trước khi viết code = TDD = ít bug hơn ✅',
  'TypeScript > JavaScript. Type safety giúp catch bugs sớm và refactor dễ hơn nhiều 📝',
  'Microservices architecture pattern cho production: Circuit breaker + Service mesh + API Gateway 🏗️',
  'Học được cách dùng Redis caching - page load từ 2s xuống còn 200ms 🚀',
  'Firebase Auth quá tiện! 5 phút setup xong authentication cho app 🔐',
  'Websocket vs Server-Sent Events vs Long polling - khi nào dùng gì? 📡',
  'Clean Code principles:\n1. Meaningful names\n2. Small functions\n3. DRY\n4. SOLID\n5. Write tests 📖',
  'Vừa contribute lần đầu vào open source! Cảm giác PR được merge rất sướng 🌟',
];

const commentContents = [
  'Ngon quá bro! Share source code được không? 😄',
  'UI đẹp lắm, design system rõ ràng 👏',
  'React Native ftw! Expo hay bare workflow vậy?',
  'Em mới học, anh có recommend tài liệu gì không ạ?',
  'Thử dùng FlashList thay FlatList đi, performance tốt hơn nhiều!',
  'Cảm ơn chia sẻ, rất hữu ích! 🙏',
  'Hay quá! Mình cũng đang học cái này',
  'Code sạch quá! Clean code thật sự 💯',
  'Đồng ý! Mình cũng gặp vấn đề tương tự',
  'Pro quá! Mình follow để học hỏi thêm',
  'Có video tutorial không? Mình muốn học theo',
  'Perfect! Đúng cái mình đang cần',
  'Cảm giác tìm được bug sau nhiều giờ debug... priceless 😂',
  'Keep it up! Năm nhất mà giỏi thế này 💪',
  'Join CLB đi, sẽ hướng dẫn từ đầu!',
  'Awesome! Mình cũng muốn thử làm project này',
  'Tips rất hay, bookmark lại dùng dần',
  'Mình cũng gặp case này, fix được chưa?',
  'Good job! Project xịn đấy 🔥',
  'Share github repo được không?',
];

const datingPromptQuestions = [
  'Điều mình thích nhất ở bản thân',
  'Sở thích cuối tuần của mình',
  'Mình tìm kiếm người như thế nào',
  'Một điều bất ngờ về mình',
  'Câu quote yêu thích',
  'Mình hạnh phúc nhất khi',
  'Điều mình muốn làm trong 5 năm tới',
  'Sở thích ẩn giấu của mình',
  'Mình thích được người khác nhớ đến vì',
  'First date lý tưởng của mình',
];

const datingPromptAnswers = [
  'Luôn lạc quan và tìm ra giải pháp cho mọi vấn đề',
  'Thích cafe, đọc sách và xem phim cùng bạn bè',
  'Người có sense of humor và biết lắng nghe',
  'Mình có thể code liên tục 10 tiếng không nghỉ khi vào trạng thái flow',
  '"The only way to do great work is to love what you do" - Steve Jobs',
  'Hoàn thành một project khó và thấy nó chạy mượt',
  'Xây dựng startup công nghệ và giúp đỡ cộng đồng',
  'Thích chơi game mobile khi stress',
  'Sự chân thành và tử tế với mọi người',
  'Đi cafe ngồi nói chuyện và hiểu nhau hơn',
  'Được nấu ăn cho người mình yêu thương',
  'Đi du lịch khám phá các địa điểm mới',
  'Chơi bóng đá cuối tuần với bạn bè',
  'Nghe nhạc acoustic và thư giãn',
  'Học được điều mới mỗi ngày',
];

const religions = ['Không', 'Phật giáo', 'Công giáo', 'Tin lành', 'Khác'];
const educations = ['Đại học', 'Cao đẳng', 'Thạc sĩ'];
const jobs = ['Sinh viên', 'Fresher Developer', 'Junior Developer', 'Intern', 'Part-time'];

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateVietnameseName(gender: Gender): string {
  const lastName = randomElement(lastNames);
  const middleName = randomElement(middleNames);
  const firstName = gender === Gender.MALE ? randomElement(firstNamesMale) : randomElement(firstNamesFemale);
  return `${lastName} ${middleName} ${firstName}`;
}

function generateStudentId(year: number, index: number): string {
  const majors = ['DCCN', 'DCAT', 'DCVT', 'DCTM'];
  const major = randomElement(majors);
  return `B${year}${major}${String(index).padStart(3, '0')}`;
}

async function main() {
  console.log('🌱 Seeding database with 1000 users...\n');

  const hashedPassword = await bcrypt.hash('Test@1234', 12);
  const now = new Date();

  // ============== CREATE 1000 USERS ==============
  console.log('👤 Creating users...');
  const usersData: any[] = [];

  for (let i = 0; i < 1000; i++) {
    const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
    const year = randomInt(21, 24);
    const fullName = generateVietnameseName(gender);
    const emailName = fullName.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/\s+/g, '');

    usersData.push({
      email: `${emailName}${i}@ptit.edu.vn`,
      password: hashedPassword,
      studentId: generateStudentId(year, i + 1),
      fullName,
      bio: randomElement(bios),
      gender,
      avatar: `https://i.pravatar.cc/300?img=${(i % 70) + 1}`,
      faculty: randomElement(faculties),
      className: randomElement(classNames),
      isVerified: Math.random() > 0.3,
      isEmailVerified: true,
      isActive: true,
      lastActiveAt: new Date(now.getTime() - randomInt(0, 7) * 24 * 60 * 60 * 1000),
      dateOfBirth: new Date(2000 + randomInt(0, 5), randomInt(0, 11), randomInt(1, 28)),
    });
  }

  // Batch insert users
  await prisma.user.createMany({ data: usersData });
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`✅ Created ${users.length} users`);

  // ============== CREATE FOLLOWS ==============
  console.log('👥 Creating follow relationships...');
  const followsData: { followerId: string; followingId: string }[] = [];
  const followSet = new Set<string>();

  for (const user of users) {
    const numFollows = randomInt(10, 50);
    const potentialFollows = shuffleArray(users.filter(u => u.id !== user.id)).slice(0, numFollows);

    for (const target of potentialFollows) {
      const key = `${user.id}-${target.id}`;
      if (!followSet.has(key)) {
        followSet.add(key);
        followsData.push({ followerId: user.id, followingId: target.id });
      }
    }
  }

  // Batch insert follows
  for (let i = 0; i < followsData.length; i += 1000) {
    await prisma.follow.createMany({ data: followsData.slice(i, i + 1000), skipDuplicates: true });
  }
  console.log(`✅ Created ${followsData.length} follows`);

  // ============== CREATE POSTS ==============
  console.log('📝 Creating posts...');
  const postsToCreate: any[] = [];

  for (const user of users) {
    const numPosts = randomInt(1, 5);
    for (let j = 0; j < numPosts; j++) {
      const daysAgo = Math.random() * 30;
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      postsToCreate.push({
        content: randomElement(postContents),
        authorId: user.id,
        privacy: PostPrivacy.PUBLIC,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  await prisma.post.createMany({ data: postsToCreate });
  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } });
  console.log(`✅ Created ${posts.length} posts`);

  // ============== CREATE LIKES ==============
  console.log('❤️ Creating likes...');
  const likesData: { userId: string; postId: string }[] = [];
  const likeSet = new Set<string>();

  for (const post of posts) {
    const numLikes = randomInt(5, 50);
    const likers = shuffleArray(users.filter(u => u.id !== post.authorId)).slice(0, numLikes);

    for (const liker of likers) {
      const key = `${liker.id}-${post.id}`;
      if (!likeSet.has(key)) {
        likeSet.add(key);
        likesData.push({ userId: liker.id, postId: post.id });
      }
    }
  }

  for (let i = 0; i < likesData.length; i += 1000) {
    await prisma.like.createMany({ data: likesData.slice(i, i + 1000), skipDuplicates: true });
  }
  console.log(`✅ Created ${likesData.length} likes`);

  // ============== CREATE COMMENTS ==============
  console.log('💬 Creating comments...');
  const commentsData: any[] = [];

  for (const post of posts) {
    const numComments = randomInt(2, 15);
    const commenters = shuffleArray(users.filter(u => u.id !== post.authorId)).slice(0, numComments);

    for (const commenter of commenters) {
      const daysAfterPost = Math.random() * 2;
      const createdAt = new Date(post.createdAt.getTime() + daysAfterPost * 24 * 60 * 60 * 1000);
      commentsData.push({
        content: randomElement(commentContents),
        authorId: commenter.id,
        postId: post.id,
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  for (let i = 0; i < commentsData.length; i += 1000) {
    await prisma.comment.createMany({ data: commentsData.slice(i, i + 1000) });
  }
  console.log(`✅ Created ${commentsData.length} comments`);

  // ============== CREATE DATING PROFILES (80% of users) ==============
  console.log('💕 Creating dating profiles...');
  const datingUsers = shuffleArray(users).slice(0, Math.floor(users.length * 0.8));

  for (const user of datingUsers) {
    // Create dating profile
    const datingProfile = await prisma.datingProfile.create({
      data: {
        userId: user.id,
        bio: randomElement(bios),
        isActive: Math.random() > 0.1,
        latitude: 21.0285 + (Math.random() - 0.5) * 0.1, // Around Hanoi
        longitude: 105.8542 + (Math.random() - 0.5) * 0.1,
        locationUpdatedAt: now,
      },
    });

    // Create 3-6 photos
    const numPhotos = randomInt(3, 6);
    const photosData = [];
    for (let i = 0; i < numPhotos; i++) {
      photosData.push({
        profileId: datingProfile.id,
        url: `https://picsum.photos/seed/${user.id}${i}/600/800`,
        order: i,
      });
    }
    await prisma.datingProfilePhoto.createMany({ data: photosData });

    // Create 2-3 prompts
    const numPrompts = randomInt(2, 3);
    const promptQuestions = shuffleArray(datingPromptQuestions).slice(0, numPrompts);
    const promptsData = promptQuestions.map((question, i) => ({
      profileId: datingProfile.id,
      question,
      answer: randomElement(datingPromptAnswers),
      order: i,
    }));
    await prisma.datingProfilePrompt.createMany({ data: promptsData });

    // Create lifestyle
    await prisma.datingProfileLifestyle.create({
      data: {
        profileId: datingProfile.id,
        education: randomElement(educations),
        job: randomElement(jobs),
        smoking: randomElement([FrequencyLevel.NEVER, FrequencyLevel.SOMETIMES, FrequencyLevel.REGULARLY]),
        drinking: randomElement([FrequencyLevel.NEVER, FrequencyLevel.SOMETIMES, FrequencyLevel.REGULARLY]),
        exercise: randomElement([FrequencyLevel.NEVER, FrequencyLevel.SOMETIMES, FrequencyLevel.REGULARLY]),
        height: randomInt(155, 185),
        religion: randomElement(religions),
      },
    });

    // Create preferences
    await prisma.datingPreferences.create({
      data: {
        profileId: datingProfile.id,
        ageMin: randomInt(18, 22),
        ageMax: randomInt(25, 30),
        maxDistance: randomInt(10, 50),
        gender: user.gender === Gender.MALE ? Gender.FEMALE : Gender.MALE,
        sameYearOnly: Math.random() > 0.7,
      },
    });
  }
  console.log(`✅ Created ${datingUsers.length} dating profiles with photos, prompts, lifestyle, and preferences`);

  // ============== CREATE SOME DATING SWIPES AND MATCHES ==============
  console.log('💘 Creating dating swipes and matches...');
  const datingProfiles = await prisma.datingProfile.findMany({ include: { user: true } });
  let swipesCount = 0;
  let matchesCount = 0;

  for (let i = 0; i < Math.min(200, datingProfiles.length); i++) {
    const fromProfile = datingProfiles[i];
    const numSwipes = randomInt(5, 20);
    const targets = shuffleArray(datingProfiles.filter(p => p.userId !== fromProfile.userId)).slice(0, numSwipes);

    for (const toProfile of targets) {
      try {
        await prisma.datingSwipe.create({
          data: {
            fromUserId: fromProfile.userId,
            toUserId: toProfile.userId,
            action: Math.random() > 0.3 ? 'LIKE' : 'UNLIKE',
          },
        });
        swipesCount++;

        // Check for mutual like -> create match
        const mutualSwipe = await prisma.datingSwipe.findFirst({
          where: {
            fromUserId: toProfile.userId,
            toUserId: fromProfile.userId,
            action: 'LIKE',
          },
        });

        if (mutualSwipe) {
          const existingMatch = await prisma.datingMatch.findFirst({
            where: {
              OR: [
                { userAId: fromProfile.userId, userBId: toProfile.userId },
                { userAId: toProfile.userId, userBId: fromProfile.userId },
              ],
            },
          });

          if (!existingMatch) {
            await prisma.datingMatch.create({
              data: {
                userAId: fromProfile.userId < toProfile.userId ? fromProfile.userId : toProfile.userId,
                userBId: fromProfile.userId < toProfile.userId ? toProfile.userId : fromProfile.userId,
              },
            });
            matchesCount++;
          }
        }
      } catch {
        // Skip duplicate swipes
      }
    }
  }
  console.log(`✅ Created ${swipesCount} swipes and ${matchesCount} matches`);

  // ============== SUMMARY ==============
  console.log('\n🎉 Seed completed!');
  console.log('📧 All accounts use password: Test@1234');
  console.log(`\n📊 Summary:`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Posts: ${posts.length}`);
  console.log(`   - Follows: ${followsData.length}`);
  console.log(`   - Likes: ${likesData.length}`);
  console.log(`   - Comments: ${commentsData.length}`);
  console.log(`   - Dating Profiles: ${datingUsers.length}`);
  console.log(`   - Swipes: ${swipesCount}`);
  console.log(`   - Matches: ${matchesCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
