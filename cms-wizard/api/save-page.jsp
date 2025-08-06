<%@ page language="java" contentType="application/json; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.io.*, java.util.*, java.net.URLDecoder" %>
<%@ page import="com.google.gson.*" %>
<%@ include file="utils/FileUtils.jsp" %>

<%
// UTF-8 인코딩 강제 설정
request.setCharacterEncoding("UTF-8");
response.setCharacterEncoding("UTF-8");
%>

<%
/**
 * CMS AI 개별 페이지 저장 API
 * JSPContentStorage.storeGeneratedContent()와 연동
 * POST 요청으로 개별 페이지를 JSON 파일로 저장
 * 
 * Parameters:
 * - siteId: 사이트 고유 ID (기본값: ewha)
 * - menuId: 메뉴 ID  
 * - submenuId: 서브메뉴 ID
 * - pageData: 페이지 데이터 JSON (title, subtitle, mainContent, features, cmsContentHTML 등)
 */

response.setContentType("application/json; charset=UTF-8");
response.setHeader("Access-Control-Allow-Origin", "*");
response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
response.setHeader("Access-Control-Allow-Headers", "Content-Type");

// OPTIONS 요청 처리 (CORS preflight)
if ("OPTIONS".equals(request.getMethod())) {
    response.setStatus(HttpServletResponse.SC_OK);
    return;
}

try {
    // POST 요청만 허용
    if (!"POST".equals(request.getMethod())) {
        out.print(fileUtils.createErrorResponse("잘못된 요청 방식", "POST 요청만 허용됩니다."));
        return;
    }
    
    // 파라미터 수집 및 디버깅
    String siteId = request.getParameter("siteId");
    String menuId = request.getParameter("menuId");
    String submenuId = request.getParameter("submenuId");
    String pageDataJson = request.getParameter("pageData");
    
    // 디버깅: 받은 파라미터 로그
    System.out.println("📥 JSP 받은 파라미터:");
    System.out.println("- siteId: " + siteId);
    System.out.println("- menuId: " + menuId);
    System.out.println("- submenuId: " + submenuId);
    System.out.println("- pageDataJson length: " + (pageDataJson != null ? pageDataJson.length() : "null"));
    
    // 모든 파라미터 이름 출력
    java.util.Enumeration<String> paramNames = request.getParameterNames();
    System.out.println("- 모든 파라미터: ");
    while (paramNames.hasMoreElements()) {
        String paramName = paramNames.nextElement();
        System.out.println("  * " + paramName + " = " + request.getParameter(paramName));
    }
    
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
    
    if (pageDataJson == null || pageDataJson.trim().isEmpty()) {
        out.print(fileUtils.createErrorResponse("필수 파라미터 누락", "pageData가 필요합니다."));
        return;
    }
    
    // URLSearchParams로 전송된 데이터는 이미 디코딩됨 - URLDecoder 제거
    // 디코딩 단계 제거하여 이중 디코딩 문제 방지
    
    // 안전한 파일명 생성
    siteId = fileUtils.sanitizeFileName(siteId);
    menuId = fileUtils.sanitizeFileName(menuId);
    submenuId = fileUtils.sanitizeFileName(submenuId);
    
    // JSON 데이터 파싱
    Gson gson = new Gson();
    Map<String, Object> pageData;
    try {
        pageData = gson.fromJson(pageDataJson, Map.class);
    } catch (Exception e) {
        out.print(fileUtils.createErrorResponse("JSON 파싱 오류", "pageData JSON 형식이 올바르지 않습니다: " + e.getMessage()));
        return;
    }
    
    // 1. 데이터 폴더 생성 (/data/siteId/menuId/)
    String dataBasePath = fileUtils.getDataBasePath(application);
    String siteDataPath = dataBasePath + File.separator + siteId;
    String menuDataPath = siteDataPath + File.separator + menuId;
    
    if (!fileUtils.createDirectories(menuDataPath)) {
        out.print(fileUtils.createErrorResponse("폴더 생성 실패", "데이터 폴더를 생성할 수 없습니다: " + menuDataPath));
        return;
    }
    
    // 2. 페이지 JSON 파일 저장 (submenuId.json)
    String pageJsonPath = menuDataPath + File.separator + submenuId + ".json";
    
    // 메타데이터 추가
    pageData.put("pageId", menuId + "/" + submenuId);
    pageData.put("siteId", siteId);
    pageData.put("menuId", menuId);
    pageData.put("submenuId", submenuId);
    
    // 타임스탬프 업데이트
    Map<String, Object> metadata = (Map<String, Object>) pageData.get("metadata");
    if (metadata == null) {
        metadata = new HashMap<>();
        pageData.put("metadata", metadata);
    }
    metadata.put("savedAt", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
    metadata.put("version", ((Number) metadata.getOrDefault("version", 0)).intValue() + 1);
    
    // JSON 파일 저장
    if (!fileUtils.saveJsonFile(pageJsonPath, pageData)) {
        out.print(fileUtils.createErrorResponse("페이지 저장 실패", "페이지 JSON 파일 저장에 실패했습니다."));
        return;
    }
    
    // 3. 사이트 정보 파일 생성/업데이트 (없는 경우만)
    String siteInfoPath = siteDataPath + File.separator + "site-info.json";
    if (!fileUtils.fileExists(siteInfoPath)) {
        Map<String, Object> siteInfo = fileUtils.createSiteInfo(siteId, "이화여자대학교", "ewha.ac.kr");
        fileUtils.saveJsonFile(siteInfoPath, siteInfo);
    }
    
    // 4. 성공 응답 생성
    Map<String, Object> responseData = new HashMap<>();
    responseData.put("siteId", siteId);
    responseData.put("menuId", menuId);
    responseData.put("submenuId", submenuId);
    responseData.put("pageId", menuId + "/" + submenuId);
    responseData.put("filePath", pageJsonPath);
    responseData.put("fileSize", new File(pageJsonPath).length());
    responseData.put("version", metadata.get("version"));
    
    // 저장된 콘텐츠 정보
    Map<String, Object> contentInfo = new HashMap<>();
    contentInfo.put("title", pageData.get("title"));
    contentInfo.put("subtitle", pageData.get("subtitle"));
    contentInfo.put("hasMainContent", pageData.get("mainContent") != null);
    contentInfo.put("hasFeatures", pageData.get("features") != null);
    contentInfo.put("hasCmsContentHTML", pageData.get("cmsContentHTML") != null);
    responseData.put("contentInfo", contentInfo);
    
    out.print(fileUtils.createSuccessResponse("페이지가 성공적으로 저장되었습니다.", responseData));
    
} catch (Exception e) {
    // 예외 처리
    StringWriter sw = new StringWriter();
    PrintWriter pw = new PrintWriter(sw);
    e.printStackTrace(pw);
    String stackTrace = sw.toString();
    
    System.err.println("save-page.jsp 오류: " + e.getMessage());
    System.err.println("Stack trace: " + stackTrace);
    
    out.print(fileUtils.createErrorResponse("서버 내부 오류", 
        "페이지 저장 중 오류가 발생했습니다: " + e.getMessage()));
}
%>