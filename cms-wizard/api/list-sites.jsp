<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.io.*, java.util.*, java.text.SimpleDateFormat" %>
<%@ include file="utils/FileUtils.jsp" %>

<%!
// 파일 크기 포맷팅 함수
public String formatFileSize(long bytes) {
    if (bytes < 1024) return bytes + " B";
    int exp = (int) (Math.log(bytes) / Math.log(1024));
    String pre = "KMGTPE".charAt(exp - 1) + "";
    return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
}
%>

<%
/**
 * CMS AI 사이트 목록 조회 API
 * GET 요청으로 생성된 모든 사이트 목록을 조회
 * 
 * Parameters:
 * - includeStats: 사이트별 통계 포함 여부 (true/false) - 기본값: false
 * - includeSiteInfo: 사이트 정보 포함 여부 (true/false) - 기본값: true
 * - sortBy: 정렬 기준 ('name', 'created', 'modified', 'size') - 기본값: 'name'
 * - order: 정렬 순서 ('asc', 'desc') - 기본값: 'asc'
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
    String includeStatsParam = request.getParameter("includeStats");
    String includeSiteInfoParam = request.getParameter("includeSiteInfo");
    String sortBy = request.getParameter("sortBy");
    String order = request.getParameter("order");
    
    // 기본값 설정
    boolean includeStats = "true".equals(includeStatsParam);
    boolean includeSiteInfo = includeSiteInfoParam == null || !"false".equals(includeSiteInfoParam);
    if (sortBy == null || sortBy.trim().isEmpty()) {
        sortBy = "name";
    }
    if (order == null || order.trim().isEmpty()) {
        order = "asc";
    }
    
    // final 변수로 복사 (익명 클래스에서 사용하기 위해)
    final String finalSortBy = sortBy;
    final String finalOrder = order;
    final boolean finalIncludeStats = includeStats;
    
    // 사이트 목록 조회
    List<String> siteIds = fileUtils.listSites(application);
    List<Map<String, Object>> sitesData = new ArrayList<>();
    
    for (String siteId : siteIds) {
        Map<String, Object> siteData = new HashMap<>();
        siteData.put("siteId", siteId);
        
        String sitePath = fileUtils.getSitePath(application, siteId);
        
        // 사이트 정보 포함
        if (includeSiteInfo) {
            String siteInfoPath = sitePath + File.separator + "site-info.json";
            Map<String, Object> siteInfo = fileUtils.readJsonFile(siteInfoPath);
            if (siteInfo != null) {
                siteData.put("siteInfo", siteInfo);
                siteData.put("siteName", siteInfo.get("siteName"));
                siteData.put("domain", siteInfo.get("domain"));
                siteData.put("createdAt", siteInfo.get("createdAt"));
                siteData.put("lastUpdated", siteInfo.get("lastUpdated"));
            }
        }
        
        // 기본 폴더 정보
        File siteDir = new File(sitePath);
        if (siteDir.exists()) {
            siteData.put("lastModified", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                .format(new Date(siteDir.lastModified())));
        }
        
        // 통계 정보 포함
        if (includeStats) {
            Map<String, Object> stats = new HashMap<>();
            
            // 메뉴 수 계산
            List<String> menus = fileUtils.listMenus(application, siteId);
            stats.put("totalMenus", menus.size());
            
            // 총 페이지 수 계산
            int totalPages = 0;
            for (String menuId : menus) {
                String menuPath = sitePath + File.separator + menuId;
                File menuDir = new File(menuPath);
                if (menuDir.exists() && menuDir.isDirectory()) {
                    File[] submenuDirs = menuDir.listFiles();
                    if (submenuDirs != null) {
                        // 디렉토리만 카운트 (File::isDirectory 대신 전통적인 방식 사용)
                        for (File f : submenuDirs) {
                            if (f.isDirectory()) {
                                totalPages++;
                            }
                        }
                    }
                }
            }
            stats.put("totalPages", totalPages);
            
            // 폴더 크기
            long siteSize = fileUtils.calculateDirectorySize(sitePath);
            stats.put("totalSize", siteSize);
            stats.put("totalSizeFormatted", formatFileSize(siteSize));
            
            siteData.put("stats", stats);
        }
        
        sitesData.add(siteData);
    }
    
    // 정렬 적용 (람다 대신 전통적인 Comparator 사용)
    Collections.sort(sitesData, new Comparator<Map<String, Object>>() {
        public int compare(Map<String, Object> a, Map<String, Object> b) {
            int result = 0;
            
            switch (finalSortBy.toLowerCase()) {
                case "name":
                    String nameA = (String) a.get("siteId");
                    String nameB = (String) b.get("siteId");
                    result = nameA.compareToIgnoreCase(nameB);
                    break;
                    
                case "created":
                    if (a.get("siteInfo") != null && b.get("siteInfo") != null) {
                        Map<String, Object> infoA = (Map<String, Object>) a.get("siteInfo");
                        Map<String, Object> infoB = (Map<String, Object>) b.get("siteInfo");
                        String createdA = (String) infoA.get("createdAt");
                        String createdB = (String) infoB.get("createdAt");
                        if (createdA != null && createdB != null) {
                            result = createdA.compareTo(createdB);
                        }
                    }
                    break;
                    
                case "modified":
                    String modifiedA = (String) a.get("lastModified");
                    String modifiedB = (String) b.get("lastModified");
                    if (modifiedA != null && modifiedB != null) {
                        result = modifiedA.compareTo(modifiedB);
                    }
                    break;
                    
                case "size":
                    if (finalIncludeStats) {
                        Map<String, Object> statsA = (Map<String, Object>) a.get("stats");
                        Map<String, Object> statsB = (Map<String, Object>) b.get("stats");
                        if (statsA != null && statsB != null) {
                            Long sizeA = ((Number) statsA.get("totalSize")).longValue();
                            Long sizeB = ((Number) statsB.get("totalSize")).longValue();
                            result = Long.compare(sizeA, sizeB);
                        }
                    }
                    break;
            }
            
            return "desc".equals(finalOrder) ? -result : result;
        }
    });
    
    // 응답 데이터 구성
    Map<String, Object> responseData = new HashMap<>();
    responseData.put("sites", sitesData);
    responseData.put("totalSites", sitesData.size());
    responseData.put("sortBy", sortBy);
    responseData.put("order", order);
    responseData.put("includeStats", includeStats);
    responseData.put("includeSiteInfo", includeSiteInfo);
    
    // 전체 통계
    if (includeStats) {
        Map<String, Object> globalStats = new HashMap<>();
        long totalSize = 0;
        int totalPages = 0;
        int totalMenus = 0;
        
        for (Map<String, Object> site : sitesData) {
            Map<String, Object> stats = (Map<String, Object>) site.get("stats");
            if (stats != null) {
                totalSize += ((Number) stats.get("totalSize")).longValue();
                totalPages += ((Number) stats.get("totalPages")).intValue();
                totalMenus += ((Number) stats.get("totalMenus")).intValue();
            }
        }
        
        globalStats.put("totalSize", totalSize);
        globalStats.put("totalSizeFormatted", formatFileSize(totalSize));
        globalStats.put("totalPages", totalPages);
        globalStats.put("totalMenus", totalMenus);
        globalStats.put("averagePagesPerSite", sitesData.size() > 0 ? (double) totalPages / sitesData.size() : 0);
        
        responseData.put("globalStats", globalStats);
    }
    
    // 성공 응답
    out.print(fileUtils.createSuccessResponse("사이트 목록 조회 성공", responseData));
    
} catch (Exception e) {
    // 예외 처리
    StringWriter sw = new StringWriter();
    PrintWriter pw = new PrintWriter(sw);
    e.printStackTrace(pw);
    String stackTrace = sw.toString();
    
    System.err.println("list-sites.jsp 오류: " + e.getMessage());
    System.err.println("Stack trace: " + stackTrace);
    
    out.print(fileUtils.createErrorResponse("서버 내부 오류", 
        "사이트 목록 조회 중 오류가 발생했습니다: " + e.getMessage()));
}
%>