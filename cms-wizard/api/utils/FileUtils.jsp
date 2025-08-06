<%@ page language="java" pageEncoding="UTF-8"%>
<%@ page import="java.io.*, java.util.*, java.nio.file.*, java.nio.charset.StandardCharsets" %>
<%@ page import="com.google.gson.*, java.text.SimpleDateFormat" %>



<%!
/**
 * CMS 콘텐츠 저장을 위한 파일 유틸리티 클래스
 * JSP 내에서 사용하는 정적 메서드들을 제공
 */
public class FileUtils {
    
    private final String GENERATED_CONTENT_PATH = "generated-content";
    private final String ENCODING = "UTF-8";
    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    
    /**
     * 사이트 폴더 경로 생성
     */
    public String getSitePath(ServletContext context, String siteId) {
        String basePath = context.getRealPath("/");
        return basePath + File.separator + GENERATED_CONTENT_PATH + File.separator + siteId;
    }
    
    /**
     * 메뉴 콘텐츠 폴더 경로 생성
     */
    public String getContentPath(ServletContext context, String siteId, String menuId, String submenuId) {
        String sitePath = getSitePath(context, siteId);
        return sitePath + File.separator + menuId + File.separator + submenuId;
    }
    
    /**
     * 폴더 생성 (재귀적)
     */
    public boolean createDirectories(String path) {
        try {
            File directory = new File(path);
            if (!directory.exists()) {
                return directory.mkdirs();
            }
            return true;
        } catch (Exception e) {
            System.err.println("디렉토리 생성 실패: " + path + " - " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 텍스트 파일 저장
     */
    public  boolean saveTextFile(String filePath, String content) {
        try {
            File file = new File(filePath);
            File parentDir = file.getParentFile();
            if (parentDir != null && !parentDir.exists()) {
                parentDir.mkdirs();
            }
            
            try (FileWriter writer = new FileWriter(file, StandardCharsets.UTF_8)) {
                writer.write(content);
                return true;
            }
        } catch (Exception e) {
            System.err.println("파일 저장 실패: " + filePath + " - " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 텍스트 파일 읽기
     */
    public String readTextFile(String filePath) {
        try {
            File file = new File(filePath);
            if (!file.exists()) {
                return null;
            }
            
            StringBuilder content = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new FileReader(file, StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    content.append(line).append("\n");
                }
            }
            return content.toString();
        } catch (Exception e) {
            System.err.println("파일 읽기 실패: " + filePath + " - " + e.getMessage());
            return null;
        }
    }
    
    /**
     * JSON 파일 저장
     */
    public  boolean saveJsonFile(String filePath, Object data) {
        try {
            String jsonContent = gson.toJson(data);
            return saveTextFile(filePath, jsonContent);
        } catch (Exception e) {
            System.err.println("JSON 파일 저장 실패: " + filePath + " - " + e.getMessage());
            return false;
        }
    }
    
    /**
     * JSON 파일 읽기
     */
    public   Map<String, Object> readJsonFile(String filePath) {
        try {
            String content = readTextFile(filePath);
            if (content == null || content.trim().isEmpty()) {
                return null;
            }
            
            return gson.fromJson(content, Map.class);
        } catch (Exception e) {
            System.err.println("JSON 파일 읽기 실패: " + filePath + " - " + e.getMessage());
            return null;
        }
    }
    
    /**
     * 사이트 정보 객체 생성
     */
    public   Map<String, Object> createSiteInfo(String siteId, String siteName, String domain) {
        Map<String, Object> siteInfo = new HashMap<>();
        siteInfo.put("siteId", siteId);
        siteInfo.put("siteName", siteName);
        siteInfo.put("domain", domain);
        siteInfo.put("theme", "academic");
        siteInfo.put("language", "ko");
        siteInfo.put("createdAt", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
        siteInfo.put("lastUpdated", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
        return siteInfo;
    }
    
    /**
     * 콘텐츠 메타데이터 객체 생성
     */
    public   Map<String, Object> createContentMetadata(String pageId, String title, String subtitle, 
                                                           String mainContent, String features, double processingTime) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("pageId", pageId);
        metadata.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
        
        // 콘텐츠 정보
        Map<String, Object> content = new HashMap<>();
        content.put("title", title);
        content.put("subtitle", subtitle);
        content.put("mainContent", parseJsonArray(mainContent));
        content.put("features", parseJsonArray(features));
        content.put("images", new ArrayList<>());
        content.put("metadata", new HashMap<>());
        metadata.put("content", content);
        
        // 생성 정보
        Map<String, Object> generationInfo = new HashMap<>();
        generationInfo.put("model", "gpt-4");
        generationInfo.put("processingTime", processingTime);
        generationInfo.put("wordCount", calculateWordCount(title, subtitle, mainContent, features));
        metadata.put("generationInfo", generationInfo);
        
        return metadata;
    }
    
    /**
     * JSON 배열 문자열을 List로 파싱
     */
    private      List<Object> parseJsonArray(String jsonStr) {
        try {
            if (jsonStr == null || jsonStr.trim().isEmpty()) {
                return new ArrayList<>();
            }
            return gson.fromJson(jsonStr, List.class);
        } catch (Exception e) {
            // JSON 파싱 실패 시 단순 문자열로 처리
            List<Object> result = new ArrayList<>();
            result.add(jsonStr);
            return result;
        }
    }
    
    /**
     * 단어 수 계산
     */
    private int calculateWordCount(String title, String subtitle, String mainContent, String features) {
        int totalChars = 0;
        
        if (title != null) totalChars += title.length();
        if (subtitle != null) totalChars += subtitle.length();
        if (mainContent != null) totalChars += mainContent.length();
        if (features != null) totalChars += features.length();
        
        return totalChars;
    }
    
    /**
     * 파일 존재 여부 확인
     */
    public boolean fileExists(String filePath) {
        return new File(filePath).exists();
    }
    
    /**
     * 폴더 내 모든 사이트 목록 조회
     */
    public   List<String> listSites(ServletContext context) {
        List<String> sites = new ArrayList<>();
        try {
            String basePath = context.getRealPath("/") + File.separator + GENERATED_CONTENT_PATH;
            File baseDir = new File(basePath);
            
            if (baseDir.exists() && baseDir.isDirectory()) {
                File[] siteDirs = baseDir.listFiles(File::isDirectory);
                if (siteDirs != null) {
                    for (File siteDir : siteDirs) {
                        sites.add(siteDir.getName());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("사이트 목록 조회 실패: " + e.getMessage());
        }
        return sites;
    }
    
    /**
     * 사이트 내 메뉴 목록 조회
     */
    public List<String> listMenus(ServletContext context, String siteId) {
        List<String> menus = new ArrayList<>();
        try {
            String sitePath = getSitePath(context, siteId);
            File siteDir = new File(sitePath);
            
            if (siteDir.exists() && siteDir.isDirectory()) {
                File[] menuDirs = siteDir.listFiles(file -> 
                    file.isDirectory() && !file.getName().equals("site-info.json")
                );
                if (menuDirs != null) {
                    for (File menuDir : menuDirs) {
                        menus.add(menuDir.getName());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("메뉴 목록 조회 실패: " + e.getMessage());
        }
        return menus;
    }
    
    /**
     * 응답 JSON 생성 (성공)
     */
    public   String createSuccessResponse(String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        response.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
        return gson.toJson(response);
    }
    
    /**
     * 응답 JSON 생성 (실패)
     */
    public   String createErrorResponse(String message, String error) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("error", error);
        response.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").format(new Date()));
        return gson.toJson(response);
    }
    
    /**
     * 안전한 파일명 생성 (특수문자 제거)
     */
    public  String sanitizeFileName(String fileName) {
        if (fileName == null) return "untitled";
        return fileName.replaceAll("[^a-zA-Z0-9가-힣._-]", "_");
    }
    
    /**
     * 폴더 크기 계산 (바이트)
     */
    public   long calculateDirectorySize(String dirPath) {
        try {
            File directory = new File(dirPath);
            return Files.walk(directory.toPath())
                    .filter(Files::isRegularFile)
                    .mapToLong(path -> {
                        try {
                            return Files.size(path);
                        } catch (Exception e) {
                            return 0L;
                        }
                    })
                    .sum();
        } catch (Exception e) {
            return 0L;
        }
    }
    
    /**
     * 데이터 베이스 경로 생성 (/data/)
     * JSP API 파일들에서 사용하는 통합 데이터 저장 경로
     */
    public String getDataBasePath(ServletContext application) {
        String basePath = application.getRealPath("/");
        return basePath + File.separator + "data";
    }
}

// FileUtils 인스턴스 생성
FileUtils fileUtils = new FileUtils();

%>