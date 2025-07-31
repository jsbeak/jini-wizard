// AI Content Generation Simulator
class AISimulator {
    constructor(app) {
        this.app = app;
        this.generationDelay = { min: 1000, max: 3000 };
        this.contentDatabase = this.initContentDatabase();
    }
    
    initContentDatabase() {
        return {
            'about': {
                'welcome': {
                    title: '혁신을 선도하는 기술 기업',
                    subtitle: '더 나은 미래를 위한 디지털 혁신의 파트너',
                    content: [
                        '우리는 최첨단 기술과 창의적인 아이디어로 비즈니스의 디지털 전환을 이끕니다.',
                        '15년 이상의 경험과 전문성을 바탕으로 고객의 성공을 위해 최선을 다하고 있습니다.',
                        '글로벌 시장에서 인정받는 기술력과 혁신적인 솔루션으로 새로운 가치를 창출합니다.'
                    ],
                    features: [
                        { title: '전문성', desc: '각 분야 최고의 전문가들이 함께합니다' },
                        { title: '혁신', desc: '끊임없는 연구개발로 미래를 준비합니다' },
                        { title: '신뢰', desc: '고객과의 약속을 최우선으로 생각합니다' }
                    ]
                },
                'company': {
                    title: '글로벌 기술 선도 기업',
                    subtitle: '혁신과 성장의 15년 역사',
                    content: [
                        '2009년 설립 이래로 지속적인 성장과 혁신을 이어가고 있습니다.',
                        '전 세계 50개국 이상에서 1,000개 이상의 프로젝트를 성공적으로 수행했습니다.',
                        'AI, 빅데이터, 클라우드 컴퓨팅 분야의 선도적인 기술력을 보유하고 있습니다.'
                    ],
                    features: [
                        { title: '글로벌 네트워크', desc: '전 세계 주요 도시에 지사 운영' },
                        { title: '기술 리더십', desc: '산업을 선도하는 혁신 기술 보유' },
                        { title: '지속가능성', desc: 'ESG 경영을 통한 사회적 책임 실천' }
                    ]
                },
                'mission': {
                    title: '기술로 더 나은 세상을 만듭니다',
                    subtitle: '혁신을 통한 가치 창출',
                    content: [
                        '우리의 미션은 기술 혁신을 통해 고객의 비즈니스 성장을 돕는 것입니다.',
                        '지속가능한 기술 개발로 사회와 환경에 긍정적인 영향을 미치고자 합니다.',
                        '모든 이해관계자와 함께 성장하는 건강한 생태계를 구축합니다.'
                    ],
                    features: [
                        { title: '비전', desc: '기술 혁신의 글로벌 리더' },
                        { title: '핵심가치', desc: '혁신, 협력, 신뢰, 책임' },
                        { title: '목표', desc: '2030년까지 탄소중립 달성' }
                    ]
                }
            },
            'research': {
                'areas': {
                    title: '미래를 만드는 연구 분야',
                    subtitle: '최첨단 기술 연구 개발',
                    content: [
                        '인공지능과 머신러닝 분야에서 세계적 수준의 연구를 진행하고 있습니다.',
                        '양자 컴퓨팅, 블록체인, IoT 등 차세대 기술 개발에 투자하고 있습니다.',
                        '산학협력을 통해 실용적이고 혁신적인 연구 성과를 창출합니다.'
                    ],
                    features: [
                        { title: 'AI/ML 연구', desc: '딥러닝, 자연어처리, 컴퓨터 비전' },
                        { title: '차세대 컴퓨팅', desc: '양자컴퓨팅, 엣지컴퓨팅' },
                        { title: '보안 기술', desc: '블록체인, 암호화, 사이버보안' }
                    ]
                },
                'projects': {
                    title: '진행 중인 혁신 프로젝트',
                    subtitle: '미래를 바꾸는 연구 개발',
                    content: [
                        '스마트시티 구축을 위한 통합 플랫폼 개발 프로젝트를 진행 중입니다.',
                        '의료 AI를 활용한 질병 조기 진단 시스템을 개발하고 있습니다.',
                        '탄소중립을 위한 에너지 최적화 솔루션을 연구하고 있습니다.'
                    ],
                    features: [
                        { title: 'Smart City 2.0', desc: '차세대 도시 인프라 플랫폼' },
                        { title: 'MediAI Pro', desc: 'AI 기반 의료 진단 시스템' },
                        { title: 'GreenTech Initiative', desc: '친환경 에너지 솔루션' }
                    ]
                },
                'publications': {
                    title: '세계가 주목하는 연구 성과',
                    subtitle: '학술 논문 및 특허',
                    content: [
                        '매년 100편 이상의 논문을 국제 학술지에 게재하고 있습니다.',
                        '500개 이상의 국내외 특허를 보유하고 있습니다.',
                        '주요 국제 컨퍼런스에서 연구 성과를 발표하고 있습니다.'
                    ],
                    features: [
                        { title: '논문 게재', desc: 'Nature, Science 등 최고 학술지' },
                        { title: '특허 보유', desc: 'AI, IoT, 블록체인 분야 핵심 특허' },
                        { title: '수상 경력', desc: '국제 학회 최우수 논문상 다수' }
                    ]
                }
            },
            'services': {
                'consulting': {
                    title: '비즈니스 혁신 컨설팅',
                    subtitle: '전략적 디지털 전환 파트너',
                    content: [
                        '산업별 맞춤형 디지털 전환 전략을 수립하고 실행을 지원합니다.',
                        'AI, 빅데이터를 활용한 비즈니스 인사이트를 제공합니다.',
                        '글로벌 베스트 프랙티스를 기반으로 최적의 솔루션을 제안합니다.'
                    ],
                    features: [
                        { title: '전략 컨설팅', desc: '디지털 전환 로드맵 수립' },
                        { title: '프로세스 혁신', desc: '업무 효율성 극대화' },
                        { title: '기술 자문', desc: '최신 기술 도입 전략' }
                    ]
                },
                'development': {
                    title: '맞춤형 솔루션 개발',
                    subtitle: '고객의 니즈에 최적화된 개발',
                    content: [
                        '엔터프라이즈급 애플리케이션을 설계하고 개발합니다.',
                        '클라우드 네이티브 아키텍처 기반의 확장 가능한 시스템을 구축합니다.',
                        '애자일 방법론을 통해 빠르고 유연한 개발을 진행합니다.'
                    ],
                    features: [
                        { title: '웹/모바일 개발', desc: '반응형 크로스플랫폼 애플리케이션' },
                        { title: '시스템 통합', desc: '레거시 시스템 현대화' },
                        { title: 'AI 솔루션', desc: '머신러닝 모델 개발 및 배포' }
                    ]
                },
                'support': {
                    title: '24/7 기술 지원 서비스',
                    subtitle: '안정적인 운영을 위한 든든한 파트너',
                    content: [
                        '연중무휴 24시간 기술 지원 서비스를 제공합니다.',
                        '전문 엔지니어가 신속한 문제 해결을 지원합니다.',
                        '예방적 유지보수로 시스템 안정성을 보장합니다.'
                    ],
                    features: [
                        { title: '실시간 모니터링', desc: '시스템 상태 24/7 감시' },
                        { title: '긴급 대응', desc: '1시간 내 현장 지원' },
                        { title: '정기 점검', desc: '월간 시스템 헬스체크' }
                    ]
                }
            },
            'team': {
                'leadership': {
                    title: '비전을 이끄는 리더십',
                    subtitle: '경험과 전문성을 갖춘 경영진',
                    content: [
                        '업계 최고의 경험과 전문성을 보유한 리더들이 회사를 이끌고 있습니다.',
                        '글로벌 기업 출신의 전문 경영인들로 구성되어 있습니다.',
                        '혁신적인 비전과 실행력으로 지속적인 성장을 주도하고 있습니다.'
                    ],
                    features: [
                        { title: 'CEO', desc: '김혁신 대표, MIT 박사, 전 구글 부사장' },
                        { title: 'CTO', desc: '이기술 이사, 스탠포드 박사, 20년 경력' },
                        { title: 'CFO', desc: '박경영 이사, 하버드 MBA, 금융 전문가' }
                    ]
                },
                'researchers': {
                    title: '세계적 수준의 연구진',
                    subtitle: '각 분야 최고의 전문가 그룹',
                    content: [
                        '박사급 연구원 200명 이상이 혁신적인 연구를 수행하고 있습니다.',
                        '국내외 유수 대학 및 연구기관 출신의 인재들로 구성되어 있습니다.',
                        '지속적인 교육과 연구 지원으로 최고의 역량을 유지하고 있습니다.'
                    ],
                    features: [
                        { title: 'AI 연구팀', desc: '딥러닝 전문가 50명' },
                        { title: '보안 연구팀', desc: '사이버보안 전문가 30명' },
                        { title: '데이터 사이언스팀', desc: '빅데이터 분석가 40명' }
                    ]
                },
                'careers': {
                    title: '함께 성장하는 기회',
                    subtitle: '당신의 미래가 시작되는 곳',
                    content: [
                        '열정과 도전정신을 가진 인재를 기다리고 있습니다.',
                        '수평적인 조직문화와 자유로운 근무환경을 제공합니다.',
                        '성장을 위한 다양한 교육 프로그램과 복지 혜택을 지원합니다.'
                    ],
                    features: [
                        { title: '채용 분야', desc: '개발, 연구, 디자인, 경영 지원' },
                        { title: '복지 혜택', desc: '유연근무, 교육지원, 건강검진' },
                        { title: '성장 기회', desc: '해외연수, 컨퍼런스 참가 지원' }
                    ]
                }
            },
            'portfolio': {
                'case-studies': {
                    title: '성공적인 프로젝트 사례',
                    subtitle: '고객과 함께 만든 혁신',
                    content: [
                        '대기업부터 스타트업까지 다양한 고객의 성공 스토리를 만들어왔습니다.',
                        '각 산업 분야별 특성에 맞는 맞춤형 솔루션을 제공했습니다.',
                        '측정 가능한 비즈니스 성과를 달성하여 고객 만족도를 높였습니다.'
                    ],
                    features: [
                        { title: '금융 혁신', desc: 'A은행 디지털 뱅킹 플랫폼 구축' },
                        { title: '제조 스마트화', desc: 'B제조 스마트팩토리 전환' },
                        { title: '리테일 혁신', desc: 'C마트 옴니채널 커머스 구축' }
                    ]
                },
                'clients': {
                    title: '신뢰하는 글로벌 파트너',
                    subtitle: '세계적인 기업들이 선택한 파트너',
                    content: [
                        'Fortune 500 기업의 30% 이상이 우리의 고객입니다.',
                        '장기적인 파트너십을 통해 지속적인 가치를 창출하고 있습니다.',
                        '고객의 성공이 우리의 성공이라는 철학으로 함께합니다.'
                    ],
                    features: [
                        { title: '글로벌 기업', desc: '구글, 마이크로소프트, 아마존' },
                        { title: '국내 대기업', desc: '삼성, LG, SK, 현대' },
                        { title: '공공기관', desc: '정부부처, 지자체, 공기업' }
                    ]
                },
                'testimonials': {
                    title: '고객이 전하는 성공 이야기',
                    subtitle: '진심 어린 감사의 말씀',
                    content: [
                        '고객들의 생생한 경험담과 성과를 공유합니다.',
                        '95% 이상의 고객 만족도를 유지하고 있습니다.',
                        '장기적인 파트너십으로 이어지는 신뢰 관계를 구축했습니다.'
                    ],
                    features: [
                        { title: 'A사 CEO', desc: '디지털 전환의 완벽한 파트너였습니다' },
                        { title: 'B사 CTO', desc: '기술력과 전문성이 탁월합니다' },
                        { title: 'C사 팀장', desc: '프로젝트 성공률 200% 향상' }
                    ]
                }
            },
            'resources': {
                'blog': {
                    title: '최신 기술 트렌드와 인사이트',
                    subtitle: '전문가의 지식을 공유합니다',
                    content: [
                        '업계 최신 동향과 기술 트렌드를 분석하여 제공합니다.',
                        '실무에 바로 적용 가능한 유용한 팁과 가이드를 공유합니다.',
                        '전문가들의 깊이 있는 인사이트를 만나보실 수 있습니다.'
                    ],
                    features: [
                        { title: 'AI/ML 시리즈', desc: '머신러닝 실전 가이드' },
                        { title: '클라우드 마이그레이션', desc: '성공적인 전환 전략' },
                        { title: '보안 베스트 프랙티스', desc: '사이버 위협 대응법' }
                    ]
                },
                'whitepapers': {
                    title: '심층 분석 리포트',
                    subtitle: '전문적인 연구 자료',
                    content: [
                        '산업별 디지털 전환 전략에 대한 심층 분석 자료를 제공합니다.',
                        '기술 도입 ROI 분석과 성공 사례를 상세히 다룹니다.',
                        '미래 기술 전망과 준비 전략을 제시합니다.'
                    ],
                    features: [
                        { title: '2024 기술 전망', desc: '차세대 기술 트렌드 분석' },
                        { title: 'DX 성공 전략', desc: '디지털 전환 로드맵' },
                        { title: 'AI 도입 가이드', desc: '기업용 AI 활용 방안' }
                    ]
                },
                'tools': {
                    title: '유용한 도구와 자료',
                    subtitle: '업무 효율을 높이는 리소스',
                    content: [
                        '개발자와 IT 전문가를 위한 유용한 도구를 제공합니다.',
                        '오픈소스 프로젝트와 SDK를 무료로 다운로드할 수 있습니다.',
                        '템플릿과 가이드라인으로 프로젝트를 빠르게 시작하세요.'
                    ],
                    features: [
                        { title: 'API 도구', desc: 'RESTful API 테스트 도구' },
                        { title: '개발 SDK', desc: 'Python, Java, Node.js SDK' },
                        { title: '템플릿', desc: '프로젝트 템플릿 모음' }
                    ]
                }
            },
            'news': {
                'latest': {
                    title: '혁신의 최전선 소식',
                    subtitle: '우리의 최신 뉴스와 업데이트',
                    content: [
                        '회사의 최신 소식과 주요 발표 내용을 전해드립니다.',
                        '새로운 제품 출시와 서비스 업데이트 정보를 확인하세요.',
                        '업계 동향과 우리의 대응 전략을 공유합니다.'
                    ],
                    features: [
                        { title: 'AI 플랫폼 2.0 출시', desc: '차세대 인공지능 플랫폼 공개' },
                        { title: '글로벌 파트너십', desc: 'MS와 전략적 제휴 체결' },
                        { title: '신규 연구소 개소', desc: '실리콘밸리 AI 연구소 오픈' }
                    ]
                },
                'events': {
                    title: '함께하는 이벤트',
                    subtitle: '지식 공유와 네트워킹의 장',
                    content: [
                        '정기적인 세미나와 워크샵을 통해 지식을 공유합니다.',
                        '업계 전문가들과의 네트워킹 기회를 제공합니다.',
                        '최신 기술 데모와 핸즈온 세션을 경험할 수 있습니다.'
                    ],
                    features: [
                        { title: 'Tech Summit 2024', desc: '연례 기술 컨퍼런스' },
                        { title: 'AI Workshop', desc: '매월 AI 실습 워크샵' },
                        { title: 'Developer Day', desc: '개발자 커뮤니티 행사' }
                    ]
                },
                'press': {
                    title: '공식 보도 자료',
                    subtitle: '투명한 소통과 정보 공개',
                    content: [
                        '회사의 주요 발표와 공식 입장을 확인할 수 있습니다.',
                        '투자 정보와 재무 실적을 투명하게 공개합니다.',
                        '사회공헌 활동과 ESG 경영 성과를 보고합니다.'
                    ],
                    features: [
                        { title: '실적 발표', desc: '2024년 1분기 매출 30% 성장' },
                        { title: 'ESG 보고서', desc: '탄소중립 목표 달성 현황' },
                        { title: '사회공헌', desc: 'IT 교육 프로그램 확대' }
                    ]
                }
            },
            'contact': {
                'info': {
                    title: '언제나 열려있는 소통 창구',
                    subtitle: '고객과 함께하는 파트너',
                    content: [
                        '궁금하신 사항이나 문의사항이 있으시면 언제든 연락주세요.',
                        '전문 상담사가 신속하고 정확한 답변을 드립니다.',
                        '다양한 채널을 통해 편리하게 소통할 수 있습니다.'
                    ],
                    features: [
                        { title: '대표전화', desc: '1588-0000 (평일 9-18시)' },
                        { title: '이메일', desc: 'contact@company.com' },
                        { title: '온라인 상담', desc: '실시간 채팅 상담 가능' }
                    ]
                },
                'location': {
                    title: '글로벌 네트워크',
                    subtitle: '전 세계 어디서나 만날 수 있습니다',
                    content: [
                        '서울 본사를 중심으로 전 세계 주요 도시에 지사가 있습니다.',
                        '각 지역별 전문가들이 현지화된 서비스를 제공합니다.',
                        '고객과 가까운 곳에서 빠른 지원이 가능합니다.'
                    ],
                    features: [
                        { title: '본사', desc: '서울 강남구 테헤란로 123' },
                        { title: '지사', desc: '뉴욕, 런던, 도쿄, 싱가포르' },
                        { title: '방문 예약', desc: '온라인으로 간편하게 예약' }
                    ]
                },
                'support': {
                    title: '전문적인 기술 지원',
                    subtitle: '문제 해결의 든든한 파트너',
                    content: [
                        '기술적인 문제나 시스템 장애 시 즉시 지원해드립니다.',
                        '원격 지원과 현장 방문 서비스를 제공합니다.',
                        '체계적인 티켓 시스템으로 문의 사항을 관리합니다.'
                    ],
                    features: [
                        { title: '긴급 지원', desc: '24/7 핫라인 운영' },
                        { title: '원격 지원', desc: '실시간 화면 공유 지원' },
                        { title: '방문 서비스', desc: '전국 당일 방문 가능' }
                    ]
                }
            }
        };
    }
    
    async generateContent(pageData) {
        const { menu, submenu } = pageData;
        const contentData = this.contentDatabase[menu.id]?.[submenu.id];
        
        if (!contentData) {
            console.warn(`No content data for ${menu.id}/${submenu.id}`);
            return;
        }
        
        // Wait for iframe to be ready and get document
        const iframeDoc = await this.waitForIframeReady();
        if (!iframeDoc) {
            console.error('Failed to access iframe document');
            return;
        }
        
        console.log('🚀 Starting AI content generation for:', `${menu.id}/${submenu.id}`);
        
        // Show AI thinking process with detailed steps
        await this.showAIProcess(iframeDoc);
        
        // Simulate initial AI processing delay
        await this.sleep(800);
        
        // Update page title with realistic typing effect
        await this.updateTitleWithTyping(iframeDoc, contentData.title);
        
        // Update subtitle with typing effect
        await this.updateSubtitleWithTyping(iframeDoc, contentData.subtitle);
        
        // Update content paragraphs with typing effect
        await this.updateContentWithTyping(iframeDoc, contentData.content);
        
        // Update feature cards with typing effect
        await this.updateFeaturesWithTyping(iframeDoc, contentData.features);
        
        // Final completion message
        this.showCompletionMessage();
        
        console.log('✅ AI content generation completed');
    }
    
    // Wait for iframe to be ready and return document
    async waitForIframeReady() {
        const iframe = document.getElementById('preview-iframe');
        if (!iframe) return null;
        
        // Wait for iframe to load
        let attempts = 0;
        while (attempts < 50) { // Max 5 seconds
            try {
                if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
                    return iframe.contentDocument;
                }
            } catch (e) {
                // Access denied, keep trying
            }
            
            await this.sleep(100);
            attempts++;
        }
        
        return null;
    }
    
    // Show final completion message
    showCompletionMessage() {
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #059669;">
                    <span style="font-size: 14px;">🎉 페이지 생성 완료!</span>
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    AI가 고품질 콘텐츠를 성공적으로 생성했습니다.
                </div>
            `;
        }
    }
    
    async updateTitle(doc, title) {
        const titleElement = doc.querySelector('.page-title');
        if (titleElement) {
            await this.app.animator.fadeContent(titleElement, true);
            await this.sleep(300);
            await this.app.animator.typewriterEffect(titleElement, title, 50);
        }
    }
    
    async updateSubtitle(doc, subtitle) {
        const subtitleElement = doc.querySelector('.page-subtitle');
        if (subtitleElement) {
            const placeholder = subtitleElement.querySelector('.placeholder-text');
            if (placeholder) {
                placeholder.classList.remove('ai-generating');
                await this.app.animator.fadeContent(placeholder, true);
                await this.sleep(200);
                placeholder.textContent = subtitle;
                await this.app.animator.fadeContent(placeholder, false);
            }
        }
    }
    
    async updateContent(doc, contentArray) {
        const contentSection = doc.querySelector('.content');
        if (!contentSection) return;
        
        const paragraphs = contentSection.querySelectorAll('p');
        
        for (let i = 0; i < Math.min(contentArray.length, paragraphs.length); i++) {
            const paragraph = paragraphs[i];
            const placeholders = paragraph.querySelectorAll('.placeholder-text');
            
            // Clear existing placeholders
            for (const placeholder of placeholders) {
                await this.app.animator.fadeContent(placeholder, true);
            }
            
            await this.sleep(200);
            
            // Replace with new content and add stagger effect
            paragraph.innerHTML = contentArray[i];
            paragraph.style.opacity = '0';
            paragraph.style.transform = 'translateY(20px)';
            
            // Stagger the appearance
            setTimeout(() => {
                paragraph.style.transition = 'all 0.5s ease';
                paragraph.style.opacity = '1';
                paragraph.style.transform = 'translateY(0)';
            }, i * 150);
        }
    }
    
    async updateFeatures(doc, features) {
        const cards = doc.querySelectorAll('.card');
        
        for (let i = 0; i < Math.min(features.length, cards.length); i++) {
            const card = cards[i];
            const feature = features[i];
            
            // Add scale animation to cards
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            
            // Update title
            const titleElement = card.querySelector('h3');
            if (titleElement) {
                const placeholder = titleElement.querySelector('.placeholder-text');
                if (placeholder) {
                    await this.app.animator.fadeContent(placeholder, true);
                    await this.sleep(100);
                    placeholder.textContent = feature.title;
                    await this.app.animator.fadeContent(placeholder, false);
                }
            }
            
            // Update description
            const descElement = card.querySelector('p');
            if (descElement) {
                const placeholders = descElement.querySelectorAll('.placeholder-text');
                for (const placeholder of placeholders) {
                    await this.app.animator.fadeContent(placeholder, true);
                }
                await this.sleep(100);
                descElement.textContent = feature.desc;
                descElement.style.opacity = '0';
                await this.app.animator.fadeContent(descElement, false);
            }
            
            // Animate card appearance with stagger
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, i * 200);
        }
    }
    
    async generateImages(doc) {
        const imagePlaceholders = doc.querySelectorAll('.image-placeholder');
        
        for (const placeholder of imagePlaceholders) {
            // Start with loading state
            placeholder.innerHTML = `
                <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(45deg, #f0f0f0, #e0e0e0);
                    color: #666;
                    border-radius: 8px;
                    font-size: 14px;
                ">
                    <div style="
                        width: 24px;
                        height: 24px;
                        border: 3px solid #6366F1;
                        border-top: 3px solid transparent;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 8px;
                    "></div>
                    AI 이미지 생성 중...
                </div>
            `;
            
            await this.sleep(2000);
            
            // Generate realistic content-aware images
            const imageTypes = [
                { type: 'chart', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '📊' },
                { type: 'photo', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '📸' },
                { type: 'diagram', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '🔄' },
                { type: 'illustration', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '🎨' }
            ];
            const randomImage = imageTypes[Math.floor(Math.random() * imageTypes.length)];
            
            placeholder.innerHTML = `
                <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: ${randomImage.bg};
                    color: white;
                    font-weight: 600;
                    border-radius: 8px;
                    position: relative;
                    overflow: hidden;
                ">
                    <div style="font-size: 2em; margin-bottom: 8px;">${randomImage.icon}</div>
                    <div style="font-size: 14px; text-align: center;">
                        AI Generated<br/>${randomImage.type.charAt(0).toUpperCase() + randomImage.type.slice(1)}
                    </div>
                    <div style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: rgba(255,255,255,0.2);
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 11px;
                        backdrop-filter: blur(4px);
                    ">
                        NEW
                    </div>
                </div>
            `;
            
            // Add generation animation
            placeholder.style.opacity = '0';
            placeholder.style.transform = 'scale(0.9)';
            placeholder.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                placeholder.style.opacity = '1';
                placeholder.style.transform = 'scale(1)';
            }, 100);
            
            await this.sleep(500);
        }
    }
    
    randomDelay() {
        return Math.random() * (this.generationDelay.max - this.generationDelay.min) + this.generationDelay.min;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Enhanced realistic typing effect with auto-scroll and progress sync
    async typeText(element, text, speed = 30, showProgress = false) {
        console.log(`⌨️ Starting typeText: "${text.substring(0, 50)}..." (${text.length} chars)`);
        
        if (!element) {
            console.error('❌ typeText: element is null');
            return;
        }
        
        element.innerHTML = '';
        
        // Add enhanced cursor with animation
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        cursor.style.cssText = `
            display: inline-block;
            width: 2px;
            height: 1.2em;
            background-color: #6366F1;
            animation: blink 1s infinite;
            margin-left: 2px;
            position: relative;
            top: 2px;
        `;
        element.appendChild(cursor);
        
        console.log('✅ Cursor added, starting character-by-character typing...');
        
        // Update status message during typing if enabled
        const statusMessage = document.getElementById('status-message');
        
        for (let i = 0; i < text.length; i++) {
            // Add character before cursor with realistic typing variation
            const char = text[i];
            const textNode = document.createTextNode(char);
            element.insertBefore(textNode, cursor);
            
            // Variable typing speed based on character type
            let charDelay = speed;
            if (char === ' ') {
                charDelay = speed * 0.5; // Faster for spaces
            } else if (char === ',' || char === '.') {
                charDelay = speed * 1.8; // Slower for punctuation
            } else if (char === '\n') {
                charDelay = speed * 2; // Pause for line breaks
            }
            
            await this.sleep(charDelay + Math.random() * 15);
            
            // Enhanced auto-scroll with smooth animation
            if (i % 10 === 0 || char === '\n') { // Scroll every 10 characters or on new lines
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }
            
            // Update progress if enabled
            if (showProgress && statusMessage && i % 20 === 0) {
                const progress = Math.round((i / text.length) * 100);
                const currentStatus = statusMessage.querySelector('span');
                if (currentStatus && currentStatus.textContent.includes('%')) {
                    currentStatus.innerHTML = currentStatus.innerHTML.replace(/\d+%/, `${progress}%`);
                }
            }
            
            // Add slight cursor movement for realism
            if (i % 5 === 0) {
                cursor.style.animation = 'none';
                setTimeout(() => {
                    cursor.style.animation = 'blink 1s infinite';
                }, 50);
            }
        }
        
        // Final scroll to ensure visibility
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
        });
        
        // Enhanced cursor removal with fade effect
        cursor.style.transition = 'opacity 0.5s ease';
        cursor.style.opacity = '0';
        
        setTimeout(() => {
            if (cursor.parentNode) {
                cursor.remove();
            }
        }, 800);
    }
    
    // Enhanced content update with typing effect and progress sync
    async updateContentWithTyping(doc, contentArray) {
        const contentElement = doc.querySelector('#ai-content');
        if (!contentElement) return;
        
        // Update status for content generation
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 14px;">📄 본문 내용 생성 중...</span>
                    <div class="spinner" style="width: 12px; height: 12px; border-width: 1px;"></div>
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    상세한 내용을 작성하고 있습니다.
                </div>
            `;
        }
        
        // Clear existing content
        contentElement.innerHTML = '';
        await this.sleep(800);
        
        // Generate content paragraphs with typing
        for (let i = 0; i < contentArray.length; i++) {
            const paragraph = doc.createElement('p');
            contentElement.appendChild(paragraph);
            
            // Add entrance animation
            paragraph.style.opacity = '0';
            paragraph.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                paragraph.style.transition = 'all 0.3s ease';
                paragraph.style.opacity = '1';
                paragraph.style.transform = 'translateY(0)';
            }, 100);
            
            await this.sleep(200);
            await this.typeText(paragraph, contentArray[i], 25, i === 0); // Show progress for first paragraph
            
            // Brief pause between paragraphs
            await this.sleep(600);
        }
    }
    
    // Enhanced title update with typing effect and progress sync
    async updateTitleWithTyping(doc, title) {
        console.log('📝 Starting title typing:', title);
        const titleElement = doc.querySelector('#ai-title');
        
        if (!titleElement) {
            console.error('❌ Title element #ai-title not found in iframe');
            return;
        }
        
        console.log('✅ Title element found, starting typing...');
        
        // Update status to show title generation
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 14px;">✍️ 제목 생성 중...</span>
                    <div class="spinner" style="width: 12px; height: 12px; border-width: 1px;"></div>
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    매력적인 제목을 작성하고 있습니다.
                </div>
            `;
        }
        
        await this.typeText(titleElement, title, 70, true); // Slower for title with progress
        console.log('✅ Title typing completed');
    }
    
    // Enhanced subtitle update with typing effect
    async updateSubtitleWithTyping(doc, subtitle) {
        const subtitleElement = doc.querySelector('#ai-subtitle');
        if (subtitleElement) {
            await this.sleep(500); // Pause between title and subtitle
            
            // Update status for subtitle
            const statusMessage = document.getElementById('status-message');
            if (statusMessage) {
                statusMessage.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 14px;">📝 부제목 생성 중...</span>
                        <div class="spinner" style="width: 12px; height: 12px; border-width: 1px;"></div>
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                        설명이 담긴 부제목을 작성합니다.
                    </div>
                `;
            }
            
            await this.typeText(subtitleElement, subtitle, 50, true);
        }
    }
    
    // Enhanced features update with typing effect
    async updateFeaturesWithTyping(doc, features) {
        // Update status for features generation
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 14px;">🎯 특징 섹션 생성 중...</span>
                    <div class="spinner" style="width: 12px; height: 12px; border-width: 1px;"></div>
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    핵심 특징들을 정리하고 있습니다.
                </div>
            `;
        }
        
        // Create and populate feature cards with typing
        const gridElement = doc.querySelector('#ai-features');
        if (gridElement && features) {
            gridElement.innerHTML = ''; // Clear existing cards
            
            for (let i = 0; i < features.length; i++) {
                const feature = features[i];
                
                // Create card structure
                const card = doc.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <h3></h3>
                    <p></p>
                `;
                gridElement.appendChild(card);
                
                // Add entrance animation
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, i * 300);
                
                // Type feature title
                const titleElement = card.querySelector('h3');
                await this.sleep(200);
                await this.typeText(titleElement, feature.title, 60);
                
                // Type feature description
                const descElement = card.querySelector('p');
                await this.sleep(300);
                await this.typeText(descElement, feature.desc, 35);
                
                // Pause before next card
                await this.sleep(500);
            }
        }
        
        // Generate placeholder image with typing effect
        await this.sleep(1000);
        await this.generateImagesWithTyping(doc);
    }
    
    // Enhanced image generation with typing announcements
    async generateImagesWithTyping(doc) {
        const imageElement = doc.querySelector('#ai-image');
        if (!imageElement) return;
        
        // Start with loading message
        await this.typeText(imageElement, '관련 이미지를 생성하고 있습니다...', 30);
        
        await this.sleep(2000);
        
        // Clear and show generated image
        imageElement.innerHTML = '';
        const imageTypes = [
            { type: 'infographic', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '📊' },
            { type: 'diagram', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '🔄' },
            { type: 'illustration', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '🎨' }
        ];
        const randomImage = imageTypes[Math.floor(Math.random() * imageTypes.length)];
        
        imageElement.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: ${randomImage.bg};
                color: white;
                font-weight: 600;
                border-radius: 8px;
                position: relative;
                overflow: hidden;
            ">
                <div style="font-size: 2.5em; margin-bottom: 12px;">${randomImage.icon}</div>
                <div style="font-size: 16px; text-align: center; line-height: 1.4;">
                    AI 생성 이미지<br/>${randomImage.type.charAt(0).toUpperCase() + randomImage.type.slice(1)}
                </div>
                <div style="
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: rgba(255,255,255,0.25);
                    padding: 6px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.2);
                ">
                    ✨ NEW
                </div>
            </div>
        `;
        
        // Fade in the generated image
        imageElement.style.opacity = '0';
        imageElement.style.transform = 'scale(0.95)';
        imageElement.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            imageElement.style.opacity = '1';
            imageElement.style.transform = 'scale(1)';
        }, 100);
    }
    
    // Enhanced AI thinking process with real-time status updates
    async showAIProcess(doc) {
        console.log('📋 Starting AI process steps...');
        
        const processSteps = [
            { 
                message: '🔍 컨텐츠 구조 분석 중...', 
                detail: '페이지 유형과 필요한 섹션을 파악하고 있습니다.',
                duration: 800 
            },
            { 
                message: '🤖 AI 모델 실행 중...', 
                detail: '자연어 생성 모델을 초기화하고 있습니다.',
                duration: 600 
            },
            { 
                message: '🔑 키워드 추출 및 분석...', 
                detail: '핵심 키워드와 주제를 분석하여 맥락을 파악합니다.',
                duration: 700 
            },
            { 
                message: '✍️ 텍스트 생성 중...', 
                detail: '고품질 콘텐츠를 생성하고 있습니다.',
                duration: 900 
            },
            { 
                message: '✅ 품질 검증 중...', 
                detail: '생성된 콘텐츠의 품질과 일관성을 검증합니다.',
                duration: 500 
            }
        ];
        
        // Show process in both status message and submenu status
        const statusMessage = document.getElementById('status-message');
        const currentSubmenuItem = document.querySelector('.submenu-item[data-status="processing"]');
        
        console.log('📊 Status elements found:', { 
            statusMessage: !!statusMessage, 
            currentSubmenuItem: !!currentSubmenuItem 
        });
        
        for (let i = 0; i < processSteps.length; i++) {
            const step = processSteps[i];
            console.log(`🔄 Processing step ${i + 1}/${processSteps.length}: ${step.message}`);
            
            // Update main status message
            if (statusMessage) {
                statusMessage.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 14px;">${step.message}</span>
                        <div class="spinner" style="width: 12px; height: 12px; border-width: 1px;"></div>
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-top: 4px; font-style: italic;">
                        ${step.detail}
                    </div>
                `;
            }
            
            // Update submenu item status if available
            if (currentSubmenuItem) {
                const progress = Math.round(((i + 1) / processSteps.length) * 100);
                currentSubmenuItem.setAttribute('data-progress', progress);
                
                // Add progress indicator to submenu title
                const submenuTitle = currentSubmenuItem.querySelector('.submenu-title');
                if (submenuTitle) {
                    const baseTitle = submenuTitle.textContent.replace(/ \(.*\)$/, '');
                    submenuTitle.innerHTML = `${baseTitle} <span style="color: #6366F1; font-size: 11px;">(${progress}%)</span>`;
                }
            }
            
            await this.sleep(step.duration);
        }
        
        // Final completion message
        if (statusMessage) {
            statusMessage.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: #059669;">
                    <span style="font-size: 14px;">🎉 AI 프로세스 완료!</span>
                </div>
                <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    이제 실시간 타이핑이 시작됩니다.
                </div>
            `;
        }
        
        console.log('✅ AI process steps completed');
    }
}