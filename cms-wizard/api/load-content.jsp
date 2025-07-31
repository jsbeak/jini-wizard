<%@ page contentType="application/json; charset=UTF-8" %>
<%@ page import="java.io.*, java.util.*, java.net.URLDecoder" %>
<%@ include file="utils/FileUtils.jsp" %>

<%
/**
 * CMS AI 콘텐츠 조회 API
 * GET 요청으로 저장된 콘텐츠를 조회
 * 
 * Parameters:
 * - siteId: 사이트 고유 ID
 * - menuId: 메뉴 ID (옵션 - 없으면 전체 사이트 조회)
 * - submenuId: 서브메뉴 ID (옵션 - menuId와 함께 사용)
 * - format: 응답 형식 ('json', 'html', 'metadata') - 기본값: 'json'
 * - includeHtml: HTML 콘텐츠 포함 여부 (true/false) - 기본값: true
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
        out.print(FileUtils.createErrorResponse("잘못된 요청 방식", "GET 요청만 허용됩니다."));
        return;
    }
    
    // 파라미터 수집
    String siteId = request.getParameter("siteId");
    String menuId = request.getParameter("menuId");
    String submenuId = request.getParameter("submenuId");
    String format = request.getParameter("format");
    String includeHtmlParam = request.getParameter("includeHtml");
    
    // 기본값 설정
    if (format == null || format.trim().isEmpty()) {
        format = "json";
    }
    boolean includeHtml = includeHtmlParam == null || !"false".equals(includeHtmlParam.toLowerCase());
    
    // 필수 파라미터 검증
    if (siteId == null || siteId.trim().isEmpty()) {
        out.print(FileUtils.createErrorResponse("필수 파라미터 누락", "siteId가 필요합니다."));
        return;
    }
    
    // URL 디코딩
    siteId = URLDecoder.decode(siteId, "UTF-8");
    if (menuId != null) {
        menuId = URLDecoder.decode(menuId, "UTF-8");
    }
    if (submenuId != null) {
        submenuId = URLDecoder.decode(submenuId, "UTF-8");
    }
    
    // 안전한 파일명 생성
    siteId = FileUtils.sanitizeFileName(siteId);
    if (menuId != null) {
        menuId = FileUtils.sanitizeFileName(menuId);
    }
    if (submenuId != null) {
        submenuId = FileUtils.sanitizeFileName(submenuId);
    }
    
    // 사이트 존재 여부 확인
    String sitePath = FileUtils.getSitePath(application, siteId);
    if (!FileUtils.fileExists(sitePath)) {
        out.print(FileUtils.createErrorResponse("사이트 없음", "해당 사이트를 찾을 수 없습니다: " + siteId));
        return;
    }
    
    Map<String, Object> responseData = new HashMap<>();
    
    // 사이트 정보 로드
    String siteInfoPath = sitePath + File.separator + "site-info.json";
    Map<String, Object> siteInfo = FileUtils.readJsonFile(siteInfoPath);
    if (siteInfo != null) {
        responseData.put("siteInfo", siteInfo);
    }
    
    // 1. 특정 페이지 조회
    if (menuId != null && submenuId != null) {
        String contentPath = FileUtils.getContentPath(application, siteId, menuId, submenuId);
        String htmlFilePath = contentPath + File.separator + "index.html";
        String metadataPath = contentPath + File.separator + "content.json";
        
        // 콘텐츠 존재 여부 확인
        if (!FileUtils.fileExists(htmlFilePath) || !FileUtils.fileExists(metadataPath)) {
            out.print(FileUtils.createErrorResponse("콘텐츠 없음", 
                "해당 페이지 콘텐츠를 찾을 수 없습니다: " + menuId + "/" + submenuId));
            return;
        }
        
        // 메타데이터 로드
        Map<String, Object> metadata = FileUtils.readJsonFile(metadataPath);
        if (metadata == null) {
            out.print(FileUtils.createErrorResponse("메타데이터 로드 실패", "content.json을 읽을 수 없습니다."));
            return;
        }
        
        Map<String, Object> pageData = new HashMap<>();
        pageData.put("pageId", menuId + "/" + submenuId);
        pageData.put("menuId", menuId);
        pageData.put("submenuId", submenuId);
        pageData.put("metadata", metadata);
        
        // HTML 콘텐츠 포함 여부
        if (includeHtml) {
            String htmlContent = FileUtils.readTextFile(htmlFilePath);
            if (htmlContent != null) {
                pageData.put("htmlContent", htmlContent);
            }
        }
        
        // 파일 정보
        Map<String, Object> fileInfo = new HashMap<>();
        fileInfo.put("htmlFile", new File(htmlFilePath).length());
        fileInfo.put("metadataFile", new File(metadataPath).length());
        fileInfo.put("lastModified", new Date(new File(htmlFilePath).lastModified()));
        pageData.put("fileInfo", fileInfo);
        
        responseData.put("page", pageData);
        
        // 형식별 응답
        if ("html".equals(format)) {
            response.setContentType("text/html; charset=UTF-8");
            out.print(FileUtils.readTextFile(htmlFilePath));
            return;
        } else if ("metadata".equals(format)) {
            out.print(FileUtils.createSuccessResponse("메타데이터 조회 성공", metadata));
            return;
        }
    }
    
    // 2. 전체 메뉴 조회 (menuId가 없는 경우)
    else if (menuId == null) {
        List<String> menuList = FileUtils.listMenus(application, siteId);
        List<Map<String, Object>> menuData = new ArrayList<>();
        
        for (String menu : menuList) {
            Map<String, Object> menuInfo = new HashMap<>();
            menuInfo.put("menuId", menu);
            
            // 메뉴 내 서브메뉴 조회
            String menuPath = sitePath + File.separator + menu;
            File menuDir = new File(menuPath);
            List<String> submenuList = new ArrayList<>();
            
            if (menuDir.exists() && menuDir.isDirectory()) {
                File[] submenuDirs = menuDir.listFiles(File::isDirectory);
                if (submenuDirs != null) {
                    for (File submenuDir : submenuDirs) {
                        String submenu = submenuDir.getName();
                        submenuList.add(submenu);
                        
                        // 간단한 메타데이터 포함 (includeHtml=false인 경우)
                        if (!includeHtml) {
                            String metadataPath = submenuDir.getAbsolutePath() + File.separator + "content.json";
                            Map<String, Object> metadata = FileUtils.readJsonFile(metadataPath);
                            if (metadata != null) {
                                Map<String, Object> submenuInfo = new HashMap<>();
                                submenuInfo.put("submenuId", submenu);
                                submenuInfo.put("metadata", metadata);
                                menuInfo.put(submenu, submenuInfo);
                            }
                        }
                    }
                }
            }
            
            menuInfo.put("submenus", submenuList);
            menuData.add(menuInfo);
        }
        
        responseData.put("menus", menuData);
        responseData.put("totalMenus", menuList.size());
    }
    
    // 3. 특정 메뉴의 서브메뉴들 조회
    else if (menuId != null && submenuId == null) {
        String menuPath = sitePath + File.separator + menuId;
        File menuDir = new File(menuPath);
        
        if (!menuDir.exists()) {
            out.print(FileUtils.createErrorResponse("메뉴 없음", "해당 메뉴를 찾을 수 없습니다: " + menuId));
            return;
        }
        
        List<Map<String, Object>> submenuData = new ArrayList<>();
        File[] submenuDirs = menuDir.listFiles(File::isDirectory);
        
        if (submenuDirs != null) {
            for (File submenuDir : submenuDirs) {
                String submenu = submenuDir.getName();
                String metadataPath = submenuDir.getAbsolutePath() + File.separator + "content.json";
                String htmlFilePath = submenuDir.getAbsolutePath() + File.separator + "index.html";
                
                Map<String, Object> submenuInfo = new HashMap<>();
                submenuInfo.put("submenuId", submenu);
                submenuInfo.put("pageId", menuId + "/" + submenu);
                
                // 메타데이터 로드
                Map<String, Object> metadata = FileUtils.readJsonFile(metadataPath);
                if (metadata != null) {
                    submenuInfo.put("metadata", metadata);
                }
                
                // HTML 콘텐츠 포함 여부
                if (includeHtml) {
                    String htmlContent = FileUtils.readTextFile(htmlFilePath);
                    if (htmlContent != null) {
                        submenuInfo.put("htmlContent", htmlContent);
                    }
                }
                
                // 파일 정보
                Map<String, Object> fileInfo = new HashMap<>();
                fileInfo.put("htmlFile", new File(htmlFilePath).length());
                fileInfo.put("metadataFile", new File(metadataPath).length());
                fileInfo.put("lastModified", new Date(new File(htmlFilePath).lastModified()));
                submenuInfo.put("fileInfo", fileInfo);
                
                submenuData.add(submenuInfo);
            }
        }
        
        responseData.put("menuId", menuId);
        responseData.put("submenus", submenuData);
        responseData.put("totalSubmenus", submenuData.size());
    }
    
    // 사이트 통계 정보
    Map<String, Object> stats = new HashMap<>();
    stats.put("totalSize", FileUtils.calculateDirectorySize(sitePath));
    stats.put("lastAccessed", new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
    responseData.put("stats", stats);
    
    // 성공 응답
    out.print(FileUtils.createSuccessResponse("콘텐츠 조회 성공", responseData));
    
} catch (Exception e) {
    // 예외 처리
    StringWriter sw = new StringWriter();
    PrintWriter pw = new PrintWriter(sw);
    e.printStackTrace(pw);
    String stackTrace = sw.toString();
    
    System.err.println("load-content.jsp 오류: " + e.getMessage());
    System.err.println("Stack trace: " + stackTrace);
    
    out.print(FileUtils.createErrorResponse("서버 내부 오류", 
        "콘텐츠 조회 중 오류가 발생했습니다: " + e.getMessage()));
}
%>