<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.io.*, java.util.*, java.net.URLDecoder" %>
<%@ page import="com.google.gson.*" %>
<%@ include file="utils/FileUtils.jsp" %>

<%
/**
 * CMS AI 세션 상태 저장 API
 * JSPContentStorage.saveSession()과 연동
 * POST 요청으로 세션 상태 정보를 저장
 * 
 * Parameters:
 * - siteId: 사이트 고유 ID (기본값: ewha)
 * - sessionData: 세션 데이터 JSON (currentPage, completedPages, totalPages, startTime, lastActivity 등)
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
    
    // 파라미터 수집
    String siteId = request.getParameter("siteId");
    String sessionDataJson = request.getParameter("sessionData");
    
    // 기본값 설정
    if (siteId == null || siteId.trim().isEmpty()) {
        siteId = "ewha";
    }
    
    // 필수 파라미터 검증
    if (sessionDataJson == null || sessionDataJson.trim().isEmpty()) {
        out.print(fileUtils.createErrorResponse("필수 파라미터 누락", "sessionData가 필요합니다."));
        return;
    }
    
    // URL 디코딩
    siteId = URLDecoder.decode(siteId, "UTF-8");
    sessionDataJson = URLDecoder.decode(sessionDataJson, "UTF-8");
    
    // 안전한 파일명 생성
    siteId = fileUtils.sanitizeFileName(siteId);
    
    // JSON 데이터 파싱
    Gson gson = new Gson();
    Map<String, Object> sessionData;
    try {
        sessionData = gson.fromJson(sessionDataJson, Map.class);
    } catch (Exception e) {
        out.print(fileUtils.createErrorResponse("JSON 파싱 오류", "sessionData JSON 형식이 올바르지 않습니다: " + e.getMessage()));
        return;
    }
    
    // 1. 데이터 폴더 생성 (/data/siteId/)
    String dataBasePath = fileUtils.getDataBasePath(application);
    String siteDataPath = dataBasePath + File.separator + siteId;
    
    if (!fileUtils.createDirectories(siteDataPath)) {
        out.print(fileUtils.createErrorResponse("폴더 생성 실패", "사이트 데이터 폴더를 생성할 수 없습니다: " + siteDataPath));
        return;
    }
    
    // 2. 세션 정보 보완
    sessionData.put("siteId", siteId);
    sessionData.put("lastSavedAt", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
    
    // 세션 ID가 없으면 생성
    if (!sessionData.containsKey("sessionId")) {
        sessionData.put("sessionId", "session_" + System.currentTimeMillis());
    }
    
    // 통계 정보 계산
    List<String> completedPages = (List<String>) sessionData.get("completedPages");
    if (completedPages != null) {
        sessionData.put("progressPercentage", 
            sessionData.get("totalPages") != null && ((Number) sessionData.get("totalPages")).intValue() > 0 
                ? (double) completedPages.size() / ((Number) sessionData.get("totalPages")).intValue() * 100 
                : 0);
    }
    
    // 3. 세션 JSON 파일 저장 (session.json)
    String sessionJsonPath = siteDataPath + File.separator + "session.json";
    
    if (!fileUtils.saveJsonFile(sessionJsonPath, sessionData)) {
        out.print(fileUtils.createErrorResponse("세션 저장 실패", "세션 JSON 파일 저장에 실패했습니다."));
        return;
    }
    
    // 4. 성공 응답 생성
    Map<String, Object> responseData = new HashMap<>();
    responseData.put("siteId", siteId);
    responseData.put("sessionId", sessionData.get("sessionId"));
    responseData.put("filePath", sessionJsonPath);
    responseData.put("fileSize", new File(sessionJsonPath).length());
    responseData.put("lastSavedAt", sessionData.get("lastSavedAt"));
    
    // 세션 통계 정보
    Map<String, Object> sessionStats = new HashMap<>();
    sessionStats.put("currentPage", sessionData.get("currentPage"));
    sessionStats.put("totalPages", sessionData.get("totalPages"));
    sessionStats.put("completedPages", completedPages != null ? completedPages.size() : 0);
    sessionStats.put("progressPercentage", sessionData.get("progressPercentage"));
    sessionStats.put("startTime", sessionData.get("startTime"));
    sessionStats.put("lastActivity", sessionData.get("lastActivity"));
    responseData.put("sessionStats", sessionStats);
    
    out.print(fileUtils.createSuccessResponse("세션이 성공적으로 저장되었습니다.", responseData));
    
} catch (Exception e) {
    // 예외 처리
    StringWriter sw = new StringWriter();
    PrintWriter pw = new PrintWriter(sw);
    e.printStackTrace(pw);
    String stackTrace = sw.toString();
    
    System.err.println("save-session.jsp 오류: " + e.getMessage());
    System.err.println("Stack trace: " + stackTrace);
    
    out.print(fileUtils.createErrorResponse("서버 내부 오류", 
        "세션 저장 중 오류가 발생했습니다: " + e.getMessage()));
}
%>