<%@ page contentType="application/json; charset=UTF-8" %>
<%@ page import="java.io.*, java.util.*, java.net.URLDecoder" %>
<%@ include file="utils/FileUtils.jsp" %>

<%
/**
 * CMS AI 콘텐츠 저장 API
 * POST 요청으로 생성된 콘텐츠를 파일 시스템에 저장
 * 
 * Parameters:
 * - siteId: 사이트 고유 ID
 * - menuId: 메뉴 ID  
 * - submenuId: 서브메뉴 ID
 * - htmlContent: 생성된 HTML 콘텐츠
 * - metadata: 콘텐츠 메타데이터 (JSON)
 * - siteName: 사이트명 (옵션)
 * - domain: 도메인 (옵션)
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
        out.print(FileUtils.createErrorResponse("잘못된 요청 방식", "POST 요청만 허용됩니다."));
        return;
    }
    
    // 파라미터 수집
    String siteId = request.getParameter("siteId");
    String menuId = request.getParameter("menuId");
    String submenuId = request.getParameter("submenuId");
    String htmlContent = request.getParameter("htmlContent");
    String metadataJson = request.getParameter("metadata");
    String siteName = request.getParameter("siteName");
    String domain = request.getParameter("domain");
    
    // 필수 파라미터 검증
    if (siteId == null || siteId.trim().isEmpty()) {
        out.print(FileUtils.createErrorResponse("필수 파라미터 누락", "siteId가 필요합니다."));
        return;
    }
    
    if (menuId == null || menuId.trim().isEmpty()) {
        out.print(FileUtils.createErrorResponse("필수 파라미터 누락", "menuId가 필요합니다."));
        return;
    }
    
    if (submenuId == null || submenuId.trim().isEmpty()) {
        out.print(FileUtils.createErrorResponse("필수 파라미터 누락", "submenuId가 필요합니다."));
        return;
    }
    
    if (htmlContent == null || htmlContent.trim().isEmpty()) {
        out.print(FileUtils.createErrorResponse("필수 파라미터 누락", "htmlContent가 필요합니다."));
        return;
    }
    
    // URL 디코딩
    siteId = URLDecoder.decode(siteId, "UTF-8");
    menuId = URLDecoder.decode(menuId, "UTF-8");
    submenuId = URLDecoder.decode(submenuId, "UTF-8");
    htmlContent = URLDecoder.decode(htmlContent, "UTF-8");
    if (metadataJson != null) {
        metadataJson = URLDecoder.decode(metadataJson, "UTF-8");
    }
    if (siteName != null) {
        siteName = URLDecoder.decode(siteName, "UTF-8");
    }
    if (domain != null) {
        domain = URLDecoder.decode(domain, "UTF-8");
    }
    
    // 안전한 파일명 생성
    siteId = FileUtils.sanitizeFileName(siteId);
    menuId = FileUtils.sanitizeFileName(menuId);
    submenuId = FileUtils.sanitizeFileName(submenuId);
    
    // 1. 사이트 폴더 생성 및 사이트 정보 저장
    String sitePath = FileUtils.getSitePath(application, siteId);
    if (!FileUtils.createDirectories(sitePath)) {
        out.print(FileUtils.createErrorResponse("폴더 생성 실패", "사이트 폴더를 생성할 수 없습니다: " + sitePath));
        return;
    }
    
    // 사이트 정보 파일 생성 (없는 경우만)
    String siteInfoPath = sitePath + File.separator + "site-info.json";
    if (!FileUtils.fileExists(siteInfoPath)) {
        Map<String, Object> siteInfo = FileUtils.createSiteInfo(
            siteId, 
            siteName != null ? siteName : "Generated Site", 
            domain != null ? domain : "example.com"
        );
        
        if (!FileUtils.saveJsonFile(siteInfoPath, siteInfo)) {
            out.print(FileUtils.createErrorResponse("사이트 정보 저장 실패", "site-info.json 저장에 실패했습니다."));
            return;
        }
    }
    
    // 2. 콘텐츠 폴더 생성
    String contentPath = FileUtils.getContentPath(application, siteId, menuId, submenuId);
    if (!FileUtils.createDirectories(contentPath)) {
        out.print(FileUtils.createErrorResponse("폴더 생성 실패", "콘텐츠 폴더를 생성할 수 없습니다: " + contentPath));
        return;
    }
    
    // 3. HTML 파일 저장
    String htmlFilePath = contentPath + File.separator + "index.html";
    if (!FileUtils.saveTextFile(htmlFilePath, htmlContent)) {
        out.print(FileUtils.createErrorResponse("HTML 저장 실패", "HTML 파일 저장에 실패했습니다."));
        return;
    }
    
    // 4. 메타데이터 저장
    String metadataPath = contentPath + File.separator + "content.json";
    Map<String, Object> metadata;
    
    if (metadataJson != null && !metadataJson.trim().isEmpty()) {
        try {
            // 전달받은 메타데이터 사용
            Gson gson = new Gson();
            metadata = gson.fromJson(metadataJson, Map.class);
        } catch (Exception e) {
            // JSON 파싱 실패 시 기본 메타데이터 생성
            String pageId = menuId + "/" + submenuId;
            metadata = FileUtils.createContentMetadata(pageId, "Generated Content", 
                "AI Generated Subtitle", htmlContent, "[]", 2.5);
        }
    } else {
        // 기본 메타데이터 생성
        String pageId = menuId + "/" + submenuId;
        metadata = FileUtils.createContentMetadata(pageId, "Generated Content", 
            "AI Generated Subtitle", htmlContent, "[]", 2.5);
    }
    
    // 타임스탬프 업데이트
    metadata.put("lastSaved", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
    metadata.put("filePath", htmlFilePath);
    metadata.put("contentPath", contentPath);
    
    if (!FileUtils.saveJsonFile(metadataPath, metadata)) {
        out.print(FileUtils.createErrorResponse("메타데이터 저장 실패", "content.json 저장에 실패했습니다."));
        return;
    }
    
    // 5. 성공 응답 생성
    Map<String, Object> responseData = new HashMap<>();
    responseData.put("siteId", siteId);
    responseData.put("menuId", menuId);
    responseData.put("submenuId", submenuId);
    responseData.put("pageId", menuId + "/" + submenuId);
    responseData.put("htmlFilePath", htmlFilePath);
    responseData.put("metadataPath", metadataPath);
    responseData.put("contentSize", htmlContent.length());
    responseData.put("folderSize", FileUtils.calculateDirectorySize(contentPath));
    
    // 저장된 파일 정보
    Map<String, Object> fileInfo = new HashMap<>();
    fileInfo.put("htmlFile", new File(htmlFilePath).length());
    fileInfo.put("metadataFile", new File(metadataPath).length());
    responseData.put("fileInfo", fileInfo);
    
    out.print(FileUtils.createSuccessResponse("콘텐츠가 성공적으로 저장되었습니다.", responseData));
    
} catch (Exception e) {
    // 예외 처리
    StringWriter sw = new StringWriter();
    PrintWriter pw = new PrintWriter(sw);
    e.printStackTrace(pw);
    String stackTrace = sw.toString();
    
    System.err.println("save-content.jsp 오류: " + e.getMessage());
    System.err.println("Stack trace: " + stackTrace);
    
    out.print(FileUtils.createErrorResponse("서버 내부 오류", 
        "콘텐츠 저장 중 오류가 발생했습니다: " + e.getMessage()));
}
%>