export const mentorClasses = [
  {
    id: 'capstone-fa24',
    name: 'Capstone Project',
    code: 'FA24_CAP391',
    semester: 'Fall 2024',
    campus: 'Hà Nội',
    studentCount: 48,
    groupCount: 12,
    projects: [
      {
        id: 'p1',
        title: 'SmartTeam PIMS',
        topic: 'Hệ thống quản lý dự án học thuật',
        status: 'In Progress',
        progress: 78,
      },
      {
        id: 'p2',
        title: 'EcoTrack Mobile',
        topic: 'Ứng dụng theo dõi môi trường',
        status: 'In Progress',
        progress: 65,
      },
      {
        id: 'p3',
        title: 'EduChain Ledger',
        topic: 'Blockchain cho chứng chỉ số',
        status: 'On Hold',
        progress: 42,
      },
    ],
    groups: [
      {
        id: 'SE1701',
        name: 'Team Alpha',
        project: 'SmartTeam PIMS',
        members: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D'],
        progress: 85,
        lastActive: '2 giờ trước',
      },
      {
        id: 'SE1704',
        name: 'Team Nexus',
        project: 'EcoTrack Mobile',
        members: ['Hoàng Văn E', 'Đỗ Thị F', 'Bùi Văn G'],
        progress: 62,
        lastActive: '1 ngày trước',
      },
      {
        id: 'AI1604',
        name: 'Team Vision',
        project: 'EduChain Ledger',
        members: ['Vũ Văn H', 'Ngô Thị I', 'Dương Văn K', 'Lý Thị L'],
        progress: 43,
        lastActive: '5 ngày trước',
      },
    ],
  },
  {
    id: 'swp391-sp25',
    name: 'Software Project',
    code: 'SP25_SWP391',
    semester: 'Spring 2025',
    campus: 'Hà Nội',
    studentCount: 36,
    groupCount: 9,
    projects: [
      {
        id: 'p4',
        title: 'Fleet Management System',
        topic: 'Quản lý đội xe doanh nghiệp',
        status: 'In Progress',
        progress: 55,
      },
      {
        id: 'p5',
        title: 'NLP Chatbot',
        topic: 'Chatbot hỗ trợ sinh viên FPT',
        status: 'In Progress',
        progress: 70,
      },
    ],
    groups: [
      {
        id: 'SE1802',
        name: 'Team Delta',
        project: 'Fleet Management System',
        members: ['Trịnh Văn M', 'Cao Thị N', 'Hà Văn O'],
        progress: 55,
        lastActive: '3 giờ trước',
      },
      {
        id: 'AI1703',
        name: 'Team Bot',
        project: 'NLP Chatbot',
        members: ['Lưu Văn P', 'Mai Thị Q', 'Tô Văn R', 'Võ Thị S'],
        progress: 70,
        lastActive: 'Hôm qua',
      },
    ],
  },
];

export const getMentorClassById = (classId) =>
  mentorClasses.find((item) => item.id === classId);
