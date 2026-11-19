// 웹 앱 접속 시 HTML 파일 반환
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('자기소개 포트폴리오')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// 구글 시트 데이터 읽어오기 API
function getPortfolioData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. About 데이터
  const aboutSheet = ss.getSheetByName('About');
  const aboutRaw = aboutSheet.getDataRange().getValues();
  const about = {};
  for (let i = 1; i < aboutRaw.length; i++) {
    if (aboutRaw[i][0]) {
      about[aboutRaw[i][0]] = aboutRaw[i][1];
    }
  }

  // 2. Activities 데이터
  const actSheet = ss.getSheetByName('Activities');
  const actRaw = actSheet.getDataRange().getValues();
  const activities = [];
  for (let i = 1; i < actRaw.length; i++) {
    if (actRaw[i][0]) {
      activities.push({
        category: actRaw[i][0],
        title: actRaw[i][1],
        period: actRaw[i][2],
        description: actRaw[i][3]
      });
    }
  }

  // 3. Skills 데이터
  const skillSheet = ss.getSheetByName('Skills');
  const skillRaw = skillSheet.getDataRange().getValues();
  const skills = [];
  for (let i = 1; i < skillRaw.length; i++) {
    if (skillRaw[i][0]) {
      skills.push({
        name: skillRaw[i][0],
        level: skillRaw[i][1]
      });
    }
  }

  return { about, activities, skills };
}

// Contact me 폼 제출 처리 API
function saveContact(formData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Contact');
    sheet.appendRow([
      new Date(),
      formData.name,
      formData.email,
      formData.message
    ]);
    return { success: true, message: '메시지가 성공적으로 전송되었습니다!' };
  } catch (error) {
    return { success: false, message: '전송에 실패했습니다: ' + error.toString() };
  }
}
