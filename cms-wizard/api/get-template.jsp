<%@ page language="java" contentType="application/json; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.io.*, java.util.*, java.nio.file.*, java.nio.charset.StandardCharsets" %>
<%@ page import="com.google.gson.*" %>

<%
// UTF-8 인코딩 설정
request.setCharacterEncoding("UTF-8");
response.setCharacterEncoding("UTF-8");
response.setContentType("application/json; charset=UTF-8");
response.setHeader("Access-Control-Allow-Origin", "*");
response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
response.setHeader("Access-Control-Allow-Headers", "Content-Type");

// OPTIONS 요청 처리 (CORS preflight)
if ("OPTIONS".equals(request.getMethod())) {
    response.setStatus(HttpServletResponse.SC_OK);
    return;
}

Gson gson = new GsonBuilder().setPrettyPrinting().create();
Map<String, Object> result = new HashMap<>();

try {
    // 파라미터 받기
    String templateId = request.getParameter("templateId");
    
    // 기본값 설정
    if (templateId == null || templateId.trim().isEmpty()) {
        templateId = "university-ewha"; // 기본 템플릿
    }
    
    // 템플릿 파일 경로
    String templatePath = application.getRealPath("/templates/" + templateId + ".html");
    File templateFile = new File(templatePath);
    
    if (!templateFile.exists()) {
        // 템플릿 파일이 없으면 오류 반환
        result.put("success", false);
        result.put("message", "템플릿을 찾을 수 없습니다: " + templateId);
        out.print(gson.toJson(result));
        return;
    }
    
    // 템플릿 파일 읽기
    StringBuilder templateContent = new StringBuilder();
    try (BufferedReader reader = new BufferedReader(
            new InputStreamReader(new FileInputStream(templateFile), StandardCharsets.UTF_8))) {
        String line;
        while ((line = reader.readLine()) != null) {
            templateContent.append(line).append("\n");
        }
    }
    
    // 템플릿 메타데이터 (나중에 확장 가능)
    Map<String, Object> templateData = new HashMap<>();
    templateData.put("templateId", templateId);
    templateData.put("templateName", getTemplateName(templateId));
    templateData.put("templateHTML", templateContent.toString());
    templateData.put("category", getTemplateCategory(templateId));
    templateData.put("description", getTemplateDescription(templateId));
    templateData.put("version", "1.0.0");
    
    // 성공 응답
    result.put("success", true);
    result.put("message", "템플릿 로드 성공");
    result.put("data", templateData);
    
} catch (Exception e) {
    // 오류 처리
    result.put("success", false);
    result.put("message", "템플릿 로드 중 오류 발생");
    result.put("error", e.getMessage());
    
    // 서버 로그에 오류 출력
    System.err.println("get-template.jsp 오류: " + e.getMessage());
    e.printStackTrace();
}

// JSON 응답 출력
out.print(gson.toJson(result));
%>

<%!
// 템플릿 이름 가져오기
private String getTemplateName(String templateId) {
    Map<String, String> templateNames = new HashMap<>();
    templateNames.put("university-ewha", "이화여자대학교 템플릿");
    templateNames.put("corporate-tech", "테크 기업 템플릿");
    templateNames.put("government-basic", "공공기관 기본 템플릿");
    
    return templateNames.getOrDefault(templateId, "기본 템플릿");
}

// 템플릿 카테고리 가져오기
private String getTemplateCategory(String templateId) {
    if (templateId.startsWith("university")) return "대학";
    if (templateId.startsWith("corporate")) return "기업";
    if (templateId.startsWith("government")) return "공공기관";
    return "기타";
}

// 템플릿 설명 가져오기
private String getTemplateDescription(String templateId) {
    Map<String, String> descriptions = new HashMap<>();
    descriptions.put("university-ewha", "이화여자대학교 스타일의 녹색 테마 템플릿");
    descriptions.put("corporate-tech", "모던한 테크 기업 스타일 템플릿");
    descriptions.put("government-basic", "정부 및 공공기관용 기본 템플릿");
    
    return descriptions.getOrDefault(templateId, "표준 템플릿");
}
%>