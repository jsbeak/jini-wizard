<%@ page contentType="application/json; charset=UTF-8" %>
<%@ page import="java.io.*, java.util.*, java.net.URLDecoder" %>
<%@ page import="com.google.gson.*" %>
<%@ include file="utils/FileUtils.jsp" %>

<%
/**
 * CMS AI 개별 페이지 조회 API
 * JSPContentStorage.getGeneratedContent()와 연동
 * GET 요청으로 개별 페이지 JSON 파일에서 데이터를 로드
 * 
 * Parameters:
 * - siteId: 사이트 고유 ID (기본값: ewha)
 * - menuId: 메뉴 ID
 * - submenuId: 서브메뉴 ID
 */

response.setContentType("application/json; charset=UTF-8");
response.setHeader("Access-Control-Allow-Origin", "*");
response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
response.setHeader("Access-Control-Allow-Headers", "Content-Type");

// OPTIONS 요청 처리 (CORS preflight)
if ("OPTIONS".equals(request.getMethod())) {
    response.setStatus(HttpServletResponse.SC_OK);
    return;
}

try {
    // GET 요청만 허용
    if (!"GET".equals(request.getMethod())) {
        out.print(fileUtils.createErrorResponse("잘못된 요청 방식", "GET 요청만 허용됩니다."));
        return;
    }
    
    // 파라미터 수집
    String siteId = request.getParameter("siteId");
    String menuId = request.getParameter("menuId");
    String submenuId = request.getParameter("submenuId");
    
    // 기본값 설정
    if (siteId == null || siteId.trim().isEmpty()) {
        siteId = "ewha";
    }
    
    // 필수 파라미터 검증
    if (menuId == null || menuId.trim().isEmpty()) {
        out.print(fileUtils.createErrorResponse("필수 파라미터 누락", "menuId가 필요합니다."));
        return;
    }
    
    if (submenuId == null || submenuId.trim().isEmpty()) {
        out.print(fileUtils.createErrorResponse("필수 파라미터 누락", "submenuId가 필요합니다."));
        return;
    }
    
    // URL 디코딩
    siteId = URLDecoder.decode(siteId, "UTF-8");
    menuId = URLDecoder.decode(menuId, "UTF-8");
    submenuId = URLDecoder.decode(submenuId, "UTF-8");
    
    // 안전한 파일명 생성
    siteId = fileUtils.sanitizeFileName(siteId);
    menuId = fileUtils.sanitizeFileName(menuId);
    submenuId = fileUtils.sanitizeFileName(submenuId);
    
    // 페이지 JSON 파일 경로 생성
    String dataBasePath = fileUtils.getDataBasePath(application);
    String pageJsonPath = dataBasePath + File.separator + siteId + File.separator + menuId + File.separator + submenuId + ".json";
    
    // 파일 존재 여부 확인
    if (!fileUtils.fileExists(pageJsonPath)) {
        out.print(fileUtils.createErrorResponse("페이지 없음", 
            "해당 페이지를 찾을 수 없습니다: " + menuId + "/" + submenuId));
        return;
    }
    
    // JSON 파일 읽기
    Map<String, Object> pageData = fileUtils.readJsonFile(pageJsonPath);
    if (pageData == null) {
        out.print(fileUtils.createErrorResponse("페이지 로드 실패", "페이지 JSON 파일을 읽을 수 없습니다."));
        return;
    }
    
    // 파일 정보 추가
    File pageFile = new File(pageJsonPath);
    Map<String, Object> fileInfo = new HashMap<>();
    fileInfo.put("fileSize", pageFile.length());
    fileInfo.put("lastModified", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .format(new Date(pageFile.lastModified())));
    fileInfo.put("filePath", pageJsonPath);
    
    // 응답 데이터 구성
    Map<String, Object> responseData = new HashMap<>();
    responseData.put("pageId", menuId + "/" + submenuId);
    responseData.put("siteId", siteId);
    responseData.put("menuId", menuId);
    responseData.put("submenuId", submenuId);
    responseData.put("pageData", pageData);
    responseData.put("fileInfo", fileInfo);
    
    // 콘텐츠 요약 정보
    Map<String, Object> contentSummary = new HashMap<>();
    contentSummary.put("title", pageData.get("title"));
    contentSummary.put("subtitle", pageData.get("subtitle"));
    contentSummary.put("hasMainContent", pageData.get("mainContent") != null);
    contentSummary.put("hasFeatures", pageData.get("features") != null);
    contentSummary.put("hasCmsContentHTML", pageData.get("cmsContentHTML") != null);
    
    // 메타데이터에서 버전 정보 추출
    Map<String, Object> metadata = (Map<String, Object>) pageData.get("metadata");
    if (metadata != null) {
        contentSummary.put("version", metadata.get("version"));
        contentSummary.put("savedAt", metadata.get("savedAt"));
    }
    
    responseData.put("contentSummary", contentSummary);
    
    out.print(fileUtils.createSuccessResponse("페이지 조회 성공", responseData));
    
} catch (Exception e) {
    // 예외 처리
    StringWriter sw = new StringWriter();
    PrintWriter pw = new PrintWriter(sw);
    e.printStackTrace(pw);
    String stackTrace = sw.toString();
    
    System.err.println("load-page.jsp 오류: " + e.getMessage());
    System.err.println("Stack trace: " + stackTrace);
    
    out.print(fileUtils.createErrorResponse("서버 내부 오류", 
        "페이지 조회 중 오류가 발생했습니다: " + e.getMessage()));
}
%>