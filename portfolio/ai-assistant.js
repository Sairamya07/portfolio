/**
 * ==========================================================================
 * AI Portfolio Assistant - Core Logic
 * Fully client-side AI assistant chatbot.
 * ==========================================================================
 */

(function() {
    // 1. Core Profile Data Object extracted directly from current portfolio index.html
    const portfolioData = {
        name: "Ramya Tangella",
        title: "B.Tech Student in Artificial Intelligence & Machine Learning | Full Stack Development Enthusiast",
        summary: "B.Tech final-year student in Artificial Intelligence and Machine Learning with a strong interest in Full Stack Development. Proficient in Python, JavaScript, Flask, and database fundamentals. Experienced in developing web applications and integrating APIs to build scalable and user-friendly solutions.",
        education: {
            degree: "B.Tech in Artificial Intelligence & Machine Learning (AI & ML)",
            college: "Kakinada Institute Of Engineering And Technology For Women",
            timeline: "2023–2027",
            gpa: "8.21 CGPA"
        },
        skills: {
            programmingLanguages: ["Python"],
            frontend: ["HTML", "CSS", "JavaScript"],
            machineLearning: ["Fundamentals Of Machine Learning"],
            toolsAndPlatforms: ["GitHub", "VS Code"],
            softSkills: ["Team Management", "Problem Solving", "Communication", "Time Management"]
        },
        projects: [
            {
                name: "AI Diet Plan Recommendation System",
                subtitle: "Personalized Health & Nutrition Application",
                techStack: ["HTML", "CSS", "Flask", "Python", "LLM API"],
                description: "Developed a web application that generates personalized diet plans using details like age, weight, height, and fitness goals. Integrated an AI/LLM API to provide customized meal recommendations and connected HTML/CSS/JS with a Flask backend.",
                github: "https://github.com/ramyathangella434"
            },
            {
                name: "AI Fitness Tracking System",
                subtitle: "Full-Stack Workout & Nutrition Analytics Platform",
                techStack: ["HTML", "CSS", "Flask", "Python"],
                description: "Developed a fitness tracking web application that records daily workouts, calories burned, and active minutes. Implemented personalized fitness recommendations based on user health data and integrated frontend with Flask backend.",
                github: "https://github.com/ramyathangella434"
            }
        ],
        certifications: [
            { title: "Python For Beginners", issuer: "Infosys Springboard" },
            { title: "Foundations of Modern ML", issuer: "IIIT Hyderabad (iHub Data)" },
            { title: "Python FullStack Certification", issuer: "EduSkills Academy" },
            { title: "AI Careers for Women", issuer: "Microsoft, SAP & Edunet Foundation" }
        ],
        achievements: [
            { title: "GitHub Version Control", desc: "Actively maintain public repositories containing clear README documentations, modular codebases, and clean structural standards." },
            { title: "Problem Solving", desc: "Actively practicing core algorithm design, data structures, and backend integration workflows." },
            { title: "Hackathons & Tech Events", desc: "Collaborated in technical ideation bootcamps to prototype cross-functional software solutions under competitive timelines." }
        ],
        contact: {
            email: "ramyathangella434@gmail.com",
            phone: "+91 6305244315",
            location: "Kakinada, India",
            linkedin: "https://linkedin.com/in/ramyathangella",
            github: "https://github.com/ramyathangella434"
        }
    };

    // Suggested Questions List
    const suggestedQuestions = [
        "Tell me about yourself.",
        "What skills do you have?",
        "What projects have you built?",
        "Show me your AI/ML projects.",
        "What certifications do you have?",
        "What achievements do you have?",
        "How can I contact you?",
        "What is your education?",
        "Are you available for internships?"
    ];

    // Response selector algorithm based STRICTLY and ONLY on portfolioData content
    function getAssistantResponse(query) {
        const cleaned = query.toLowerCase().trim();

        // 1. About me / Bio
        if (cleaned.includes("about yourself") || cleaned.includes("tell me about yourself") || 
            cleaned.includes("who are you") || cleaned.includes("biography") || 
            cleaned.includes("about you") || cleaned.endsWith("who you are")) {
            return `<strong>Ramya Tangella</strong> is a B.Tech final-year student in Artificial Intelligence and Machine Learning (AI & ML) who is also a Full Stack Development Enthusiast.<br><br>${portfolioData.summary}`;
        }

        // 2. Education
        if (cleaned.includes("education") || cleaned.includes("college") || 
            cleaned.includes("degree") || cleaned.includes("cgpa") || 
            cleaned.includes("study") || cleaned.includes("studied") || 
            cleaned.includes("gpa")) {
            return `<strong>Education Details:</strong><br>
            • <strong>Degree:</strong> ${portfolioData.education.degree}<br>
            • <strong>Institution:</strong> ${portfolioData.education.college}<br>
            • <strong>Timeline:</strong> ${portfolioData.education.timeline}<br>
            • <strong>Result:</strong> ${portfolioData.education.gpa}`;
        }

        // 3. Technical Exposure & Skills
        if (cleaned.includes("skills") || cleaned.includes("technologies") || 
            cleaned.includes("technology") || cleaned.includes("know") || 
            cleaned.includes("languages") || cleaned.includes("tech stack")) {
            return `<strong>Technical Skills Profile:</strong><br>
            • <strong>Programming Languages:</strong> ${portfolioData.skills.programmingLanguages.join(", ")}<br>
            • <strong>Frontend Development:</strong> ${portfolioData.skills.frontend.join(", ")}<br>
            • <strong>Machine Learning:</strong> ${portfolioData.skills.machineLearning.join(", ")}<br>
            • <strong>Tools & Platforms:</strong> ${portfolioData.skills.toolsAndPlatforms.join(", ")}<br>
            • <strong>Soft Skills:</strong> ${portfolioData.skills.softSkills.join(", ")}`;
        }

        // 4. Projects (General or specific AI/ML projects)
        if (cleaned.includes("project") || cleaned.includes("projects") || 
            cleaned.includes("built") || cleaned.includes("developed") || 
            cleaned.includes("apps") || cleaned.includes("system") || 
            cleaned.includes("portfolio work")) {
            
            const isAiMlRequest = cleaned.includes("ai") || cleaned.includes("ml") || cleaned.includes("machine learning");
            let greeting = `<strong>Projects Portfolio:</strong><br>`;
            if (isAiMlRequest) {
                greeting = `<strong>AI & Machine Learning Projects:</strong><br>`;
            }

            const projResponses = portfolioData.projects.map((proj, idx) => {
                return `${idx + 1}. <strong>${proj.name}</strong> (${proj.subtitle})<br>
                • <strong>Tech Stack:</strong> ${proj.techStack.join(", ")}<br>
                • <strong>Description:</strong> ${proj.description}<br>
                • <strong>Repository:</strong> <a href="${proj.github}" target="_blank" rel="noopener noreferrer">View GitHub Project</a>`;
            }).join("<br><br>");

            return greeting + projResponses;
        }

        // 5. Certifications
        if (cleaned.includes("certification") || cleaned.includes("certifications") || 
            cleaned.includes("certified") || cleaned.includes("certificates") || 
            cleaned.includes("certificate") || cleaned.includes("courses")) {
            
            const certs = portfolioData.certifications.map((cert) => {
                return `• <strong>${cert.title}</strong> — Issued by ${cert.issuer}`;
            }).join("<br>");

            return `<strong>Professional Certifications:</strong><br>${certs}`;
        }

        // 6. Achievements
        if (cleaned.includes("achievement") || cleaned.includes("achievements") || 
            cleaned.includes("exposure") || cleaned.includes("hackathon") || 
            cleaned.includes("honors") || cleaned.includes("trophy")) {
            
            const achs = portfolioData.achievements.map((ach) => {
                return `• <strong>${ach.title}</strong>: ${ach.desc}`;
            }).join("<br><br>");

            return `<strong>Achievements & Technical Exposure:</strong><br>${achs}`;
        }

        // 7. Contact Details
        if (cleaned.includes("contact") || cleaned.includes("email") || 
            cleaned.includes("phone") || cleaned.includes("call") || 
            cleaned.includes("reach") || cleaned.includes("address") || 
            cleaned.includes("linkedin") || cleaned.includes("mobile") || 
            cleaned.includes("location")) {
            return `<strong>Ways to Contact Ramya Tangella:</strong><br>
            • <strong>Email:</strong> <a href="mailto:${portfolioData.contact.email}">${portfolioData.contact.email}</a><br>
            • <strong>Phone:</strong> <a href="tel:${portfolioData.contact.phone}">${portfolioData.contact.phone}</a><br>
            • <strong>Location:</strong> ${portfolioData.contact.location}<br>
            • <strong>LinkedIn:</strong> <a href="${portfolioData.contact.linkedin}" target="_blank" rel="noopener noreferrer">${portfolioData.contact.linkedin}</a><br>
            • <strong>GitHub:</strong> <a href="${portfolioData.contact.github}" target="_blank" rel="noopener noreferrer">${portfolioData.contact.github}</a><br><br>
            You can also send a direct message using the contact form at the bottom of the page!`;
        }

        // Fallback for any other questions (e.g. internships, unavailable info)
        return "I'm sorry, I couldn't find that information in this portfolio.";
    }

    // 2. Build Chatbot UI elements dynamically in client DOM to keep index.html clean
    function initializeChatbotWidget() {
        const rootContainer = document.createElement("div");
        rootContainer.className = "ai-chat-root";
        
        // Chat Toggle Button (FAB)
        const fab = document.createElement("button");
        fab.className = "ai-assistant-fab";
        fab.setAttribute("aria-label", "Open AI Assistant");
        fab.innerHTML = '<i class="fas fa-robot animate-pulse"></i><span class="fab-status"></span>';
        
        // Chat Window Container
        const chatWindow = document.createElement("div");
        chatWindow.className = "ai-chat-window";
        chatWindow.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-chat-profile">
                    <div class="ai-chat-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="ai-chat-title-group">
                        <span class="ai-chat-title">Ramya's AI Assistant</span>
                        <span class="ai-chat-status">Online</span>
                    </div>
                </div>
                <div class="ai-chat-controls">
                    <button class="ai-chat-ctrl-btn ai-chat-clear-btn" id="ai-chat-clear" title="Clear conversation history">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button class="ai-chat-ctrl-btn ai-chat-close-btn" id="ai-chat-close" title="Close chat window">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="ai-chat-body" id="ai-chat-body">
                <!-- Message elements will load here -->
            </div>
            <div class="ai-chat-suggestions" id="ai-chat-suggestions">
                <!-- Suggested chips will render here -->
            </div>
            <div class="ai-chat-input-area">
                <div class="ai-chat-input-wrapper">
                    <input type="text" class="ai-chat-input" id="ai-chat-input" placeholder="Type a question..." maxlength="200" autocomplete="off">
                </div>
                <button class="ai-chat-send-btn" id="ai-chat-send" title="Send message" disabled>
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `;
        
        rootContainer.appendChild(fab);
        rootContainer.appendChild(chatWindow);
        document.body.appendChild(rootContainer);
        
        // Element Bindings
        const inputField = chatWindow.querySelector("#ai-chat-input");
        const sendBtn = chatWindow.querySelector("#ai-chat-send");
        const chatBody = chatWindow.querySelector("#ai-chat-body");
        const clearBtn = chatWindow.querySelector("#ai-chat-clear");
        const closeBtn = chatWindow.querySelector("#ai-chat-close");
        const suggestionsBox = chatWindow.querySelector("#ai-chat-suggestions");
        
        // Initialize State and Event Listeners
        let chatHistory = [];
        
        // Toggle Open/Close
        fab.addEventListener("click", () => {
            chatWindow.classList.toggle("open");
            if (chatWindow.classList.contains("open")) {
                inputField.focus();
                // Scroll to bottom on open to ensure readability
                chatBody.scrollTop = chatBody.scrollHeight;
            }
        });
        
        closeBtn.addEventListener("click", () => {
            chatWindow.classList.remove("open");
        });
        
        // Enable/Disable Send button based on input content
        inputField.addEventListener("input", () => {
            sendBtn.disabled = inputField.value.trim() === "";
        });
        
        // Handle Submit on Enter key
        inputField.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && inputField.value.trim() !== "") {
                submitUserMessage();
            }
        });
        
        sendBtn.addEventListener("click", () => {
            if (inputField.value.trim() !== "") {
                submitUserMessage();
            }
        });
        
        clearBtn.addEventListener("click", () => {
            if (confirm("Are you sure you want to clear the conversation history?")) {
                sessionStorage.removeItem("ramya_portfolio_chat");
                loadConversationHistory();
            }
        });

        // Initialize Chat History from Storage
        loadConversationHistory();
        renderSuggestions();

        // Core Functions
        function loadConversationHistory() {
            chatBody.innerHTML = "";
            const stored = sessionStorage.getItem("ramya_portfolio_chat");
            
            if (stored) {
                chatHistory = JSON.parse(stored);
                chatHistory.forEach(msg => {
                    appendMessageBubble(msg.sender, msg.text, msg.time, false);
                });
            } else {
                chatHistory = [];
                // Default Welcome Message
                const welcomeText = "Hi! I am Ramya Tangella's Portfolio Assistant. How can I help you today? You can select any category below or type your questions.";
                const welcomeTime = getCurrentFormattedTime();
                appendMessageBubble("ai", welcomeText, welcomeTime, false);
            }
            scrollToBottom();
        }

        function saveConversation() {
            sessionStorage.setItem("ramya_portfolio_chat", JSON.stringify(chatHistory));
        }

        function getCurrentFormattedTime() {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; // hour '0' should be '12'
            return `${hours}:${minutes} ${ampm}`;
        }

        function appendMessageBubble(sender, text, time, animate = true) {
            const row = document.createElement("div");
            row.className = `ai-chat-msg-row ${sender}`;
            
            const bubble = document.createElement("div");
            bubble.className = "ai-chat-bubble";
            bubble.innerHTML = text;
            
            // Add Timestamp
            const timestamp = document.createElement("span");
            timestamp.className = "ai-chat-time";
            timestamp.innerText = time;
            bubble.appendChild(timestamp);

            // Add Copy Button to AI Bubbles
            if (sender === "ai") {
                const copyBtn = document.createElement("button");
                copyBtn.className = "ai-chat-copy-btn";
                copyBtn.setAttribute("title", "Copy response");
                copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                copyBtn.addEventListener("click", () => {
                    // Extract plaintext. Replace line breaks with newlines.
                    let plainText = bubble.innerHTML
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<li>/gi, '• ')
                        .replace(/<\/li>/gi, '\n')
                        .replace(/<\/?[^>]+(>|$)/g, ""); // Strip HTML tags
                    
                    // Remove the timestamp string and copy button title from text
                    const timeIndex = plainText.lastIndexOf(time);
                    if (timeIndex !== -1) {
                        plainText = plainText.substring(0, timeIndex).trim();
                    }

                    navigator.clipboard.writeText(plainText).then(() => {
                        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                        copyBtn.classList.add("copied");
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                            copyBtn.classList.remove("copied");
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                    });
                });
                bubble.appendChild(copyBtn);
            }

            row.appendChild(bubble);
            chatBody.appendChild(row);
            
            if (animate) {
                row.style.opacity = 0;
                row.style.transform = "translateY(10px)";
                row.getBoundingClientRect(); // Trigger reflow
                row.style.transition = "all 0.3s ease";
                row.style.opacity = 1;
                row.style.transform = "translateY(0)";
            }
        }

        function showTypingIndicator() {
            const row = document.createElement("div");
            row.className = "ai-chat-msg-row ai typing-indicator-row";
            
            const bubble = document.createElement("div");
            bubble.className = "ai-chat-bubble typing";
            bubble.innerHTML = `
                <div class="ai-chat-typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            
            row.appendChild(bubble);
            chatBody.appendChild(row);
            scrollToBottom();
            return row;
        }

        function removeTypingIndicator(indicatorElement) {
            if (indicatorElement && indicatorElement.parentNode) {
                indicatorElement.parentNode.removeChild(indicatorElement);
            }
        }

        function renderSuggestions() {
            suggestionsBox.innerHTML = "";
            suggestedQuestions.forEach(q => {
                const chip = document.createElement("button");
                chip.className = "ai-chat-suggest-chip";
                chip.innerText = q;
                chip.addEventListener("click", () => {
                    inputField.value = q;
                    submitUserMessage();
                });
                suggestionsBox.appendChild(chip);
            });
        }

        function scrollToBottom() {
            chatBody.scrollTop = chatBody.scrollHeight;
        }

        function submitUserMessage() {
            const text = inputField.value.trim();
            if (text === "") return;
            
            // Clear Input
            inputField.value = "";
            sendBtn.disabled = true;
            
            const userTime = getCurrentFormattedTime();
            
            // Append and store user message
            appendMessageBubble("user", text, userTime);
            chatHistory.push({ sender: "user", text: text, time: userTime });
            saveConversation();
            scrollToBottom();
            
            // Display simulated AI Typing indicator
            const indicator = showTypingIndicator();
            
            const simulatedDelay = 600 + Math.random() * 400; // 600ms to 1000ms delay
            
            setTimeout(() => {
                removeTypingIndicator(indicator);
                
                // Fetch context specific reply
                const responseText = getAssistantResponse(text);
                const aiTime = getCurrentFormattedTime();
                
                appendMessageBubble("ai", responseText, aiTime);
                chatHistory.push({ sender: "ai", text: responseText, time: aiTime });
                saveConversation();
                scrollToBottom();
            }, simulatedDelay);
        }
    }

    // Initialize on window DOM load
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeChatbotWidget);
    } else {
        initializeChatbotWidget();
    }
})();
