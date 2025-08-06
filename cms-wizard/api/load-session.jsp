<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.io.*, java.util.*, java.net.URLDecoder" %>
<%@ page import="com.google.gson.*" %>
<%@ include file="utils/FileUtils.jsp" %>

<%
/**
 * CMS AI 세션 복구 API
 * JSPContentStorage.restoreSession()과 연동
 * GET 요청으로 저장된 세션 정보를 복구
 * 
 * Parameters:
 * - siteId: 사이트 고유 ID (기본값: ewha)
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
    
    // 기본값 설정
    if (siteId == null || siteId.trim().isEmpty()) {
        siteId = "ewha";
    }
    
    // URL 디코딩
    siteId = URLDecoder.decode(siteId, "UTF-8");
    
    // 안전한 파일명 생성
    siteId = fileUtils.sanitizeFileName(siteId);
    
    // 세션 JSON 파일 경로 생성
    String dataBasePath = fileUtils.getDataBasePath(application);
    String sessionJsonPath = dataBasePath + File.separator + siteId + File.separator + "session.json";
    
    // 파일 존재 여부 확인
    if (!fileUtils.fileExists(sessionJsonPath)) {
        out.print(fileUtils.createErrorResponse("세션 없음", 
            "저장된 세션을 찾을 수 없습니다. 새로운 세션을 시작하세요."));
        return;
    }
    
    // JSON 파일 읽기
    Map<String, Object> sessionData = fileUtils.readJsonFile(sessionJsonPath);
    if (sessionData == null) {
        out.print(fileUtils.createErrorResponse("세션 로드 실패", "세션 JSON 파일을 읽을 수 없습니다."));
        return;
    }
    
    // 세션 유효성 검사
    String startTime = (String) sessionData.get("startTime");
    String lastActivity = (String) sessionData.get("lastActivity");
    
    // 24시간 이상 경과한 세션은 만료로 처리
    if (lastActivity != null) {
        try {
            java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
            Date lastActivityDate = sdf.parse(lastActivity);
            long hoursDiff = (new Date().getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);
            
            if (hoursDiff > 24) {
                out.print(fileUtils.createErrorResponse("세션 만료", 
                    "세션이 만료되었습니다 (24시간 경과). 새로운 세션을 시작하세요."));
                return;
            }
        } catch (Exception e) {
            // 날짜 파싱 실패 시 세션을 유효한 것으로 처리
            System.err.println("세션 날짜 파싱 실패: " + e.getMessage());
        }
    }
    
    // 파일 정보 추가
    File sessionFile = new File(sessionJsonPath);
    Map<String, Object> fileInfo = new HashMap<>();
    fileInfo.put("fileSize", sessionFile.length());
    fileInfo.put("lastModified", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .format(new Date(sessionFile.lastModified())));
    fileInfo.put("filePath", sessionJsonPath);
    
    // 세션 복구 시간 기록
    sessionData.put("restoredAt", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
    
    // 응답 데이터 구성
    Map<String, Object> responseData = new HashMap<>();
    responseData.put("siteId", siteId);
    responseData.put("sessionData", sessionData);
    responseData.put("fileInfo", fileInfo);
    
    // 세션 요약 정보
    Map<String, Object> sessionSummary = new HashMap<>();
    sessionSummary.put("sessionId", sessionData.get("sessionId"));
    sessionSummary.put("currentPage", sessionData.get("currentPage"));
    sessionSummary.put("startTime", sessionData.get("startTime"));
    sessionSummary.put("lastActivity", sessionData.get("lastActivity"));
    
    // 진행 상황 계산
    List<String> completedPages = (List<String>) sessionData.get("completedPages");
    Object totalPagesObj = sessionData.get("totalPages");
    if (completedPages != null && totalPagesObj != null) {
        int totalPages = ((Number) totalPagesObj).intValue();
        int completed = completedPages.size();
        double progressPercentage = totalPages > 0 ? (double) completed / totalPages * 100 : 0;
        
        sessionSummary.put("totalPages", totalPages);
        sessionSummary.put("completedPages", completed);
        sessionSummary.put("remainingPages", totalPages - completed);
        sessionSummary.put("progressPercentage", Math.round(progressPercentage * 100.0) / 100.0);
    }
    
    responseData.put("sessionSummary", sessionSummary);
    
    // 복구 가능한 페이지 목록
    if (completedPages != null && !completedPages.isEmpty()) {
        List<Map<String, Object>> recoverablePages = new ArrayList<>();
        
        for (String pageId : completedPages) {
            try {
                String[] parts = pageId.split("/");
                if (parts.length == 2) {
                    String menuId = parts[0];
                    String submenuId = parts[1];
                    
                    // 페이지 파일 존재 여부 확인
                    String pageJsonPath = dataBasePath + File.separator + siteId + File.separator + menuId + File.separator + submenuId + ".json";
                    if (fileUtils.fileExists(pageJsonPath)) {
                        Map<String, Object> pageInfo = new HashMap<>();
                        pageInfo.put("pageId", pageId);
                        pageInfo.put("menuId", menuId);
                        pageInfo.put("submenuId", submenuId);
                        pageInfo.put("available", true);
                        recoverablePages.add(pageInfo);
                    } else {
                        Map<String, Object> pageInfo = new HashMap<>();
                        pageInfo.put("pageId", pageId);
                        pageInfo.put("menuId", menuId);
                        pageInfo.put("submenuId", submenuId);
                        pageInfo.put("available", false);
                        recoverablePages.add(pageInfo);
                    }
                }
            } catch (Exception e) {
                // 개별 페이지 처리 실패 시 무시
                continue;
            }
        }
        
        responseData.put("recoverablePages", recoverablePages);
    }
    
    out.print(fileUtils.createSuccessResponse("세션 복구 성공", responseData));
    
} catch (Exception e) {
    // 예외 처리
    StringWriter sw = new StringWriter();
    PrintWriter pw = new PrintWriter(sw);
    e.printStackTrace(pw);
    String stackTrace = sw.toString();
    
    System.err.println("load-session.jsp 오류: " + e.getMessage());
    System.err.println("Stack trace: " + stackTrace);
    
    out.print(fileUtils.createErrorResponse("서버 내부 오류", 
        "세션 복구 중 오류가 발생했습니다: " + e.getMessage()));
}
%>