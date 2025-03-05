import { createApp, ref, reactive, watch, computed, onMounted } from 'vue';

createApp({
    setup() {
        // State management
        const currentScreen = ref('loading');
        const loadingProgress = ref(0);
        const loadingMessage = ref('Loading game assets...');
        const hasSavedGame = ref(false);
        const settings = reactive({
            textToSpeech: false,
            textSpeed: 5
        });
        
        // Characters data
        const characters = reactive([
            {
                id: 1,
                name: 'Alex',
                gender: 'male',
                shortDescription: 'An ambitious photographer who loves adventure and the outdoors',
                longDescription: 'Alex has traveled to over 20 countries capturing breathtaking landscapes. When not behind the camera, you'll find him hiking or rock climbing.',
                interests: ['photography', 'hiking', 'travel', 'rock climbing'],
                traits: ['adventurous', 'passionate', 'detail-oriented'],
                imageUrl: null,
                memory: []
            },
            {
                id: 2,
                name: 'Jamie',
                gender: 'non-binary',
                shortDescription: 'A tech entrepreneur with a love for sci-fi and board games',
                longDescription: 'Jamie founded a successful tech startup at 25. They host weekly board game nights and have an impressive collection of sci-fi memorabilia.',
                interests: ['technology', 'board games', 'sci-fi', 'entrepreneurship'],
                traits: ['innovative', 'strategic', 'ambitious'],
                imageUrl: null,
                memory: []
            },
            {
                id: 3,
                name: 'Morgan',
                gender: 'female',
                shortDescription: 'A passionate chef who dreams of opening their own restaurant',
                longDescription: 'Morgan studied culinary arts in Paris and specializes in fusion cuisine. She spends weekends at farmers markets looking for unique ingredients.',
                interests: ['cooking', 'fine dining', 'farmers markets', 'wine tasting'],
                traits: ['creative', 'perfectionist', 'passionate'],
                imageUrl: null,
                memory: []
            },
            {
                id: 4,
                name: 'Taylor',
                gender: 'female',
                shortDescription: 'A marine biologist with contagious enthusiasm for ocean life',
                longDescription: 'Taylor has dedicated her career to marine conservation and has discovered several new species. She scuba dives whenever possible.',
                interests: ['marine biology', 'conservation', 'scuba diving', 'education'],
                traits: ['enthusiastic', 'inquisitive', 'dedicated'],
                imageUrl: null,
                memory: []
            },
            {
                id: 5,
                name: 'Kai',
                gender: 'male',
                shortDescription: 'A laid-back musician who plays in local venues on weekends',
                longDescription: 'Kai can play five instruments and composes his own music. By day, he works as a sound engineer, while nights are spent performing at local venues.',
                interests: ['music', 'composing', 'performing', 'vinyl records'],
                traits: ['creative', 'laid-back', 'passionate'],
                imageUrl: null,
                memory: []
            }
        ]);
        
        // Locations data
        const locations = reactive([
            {
                id: 1,
                name: 'Cozy Café',
                description: 'A charming café with a warm atmosphere, perfect for quiet conversations and getting to know someone over coffee.',
                activities: ['coffee tasting', 'board games', 'people watching'],
                imageUrl: null
            },
            {
                id: 2,
                name: 'Sunset Beach',
                description: 'A beautiful beach with golden sands and stunning views, ideal for romantic walks and watching the sunset together.',
                activities: ['beach walk', 'shell collecting', 'sunset watching', 'picnic'],
                imageUrl: null
            },
            {
                id: 3,
                name: 'Central Park',
                description: 'A vibrant park with lush greenery and a small lake, offering various activities from boating to simply relaxing on the grass.',
                activities: ['boating', 'picnic', 'people watching', 'nature walk'],
                imageUrl: null
            },
            {
                id: 4,
                name: 'Moonlight Restaurant',
                description: 'An elegant restaurant with sophisticated ambiance, known for its exquisite cuisine and romantic setting.',
                activities: ['fine dining', 'wine tasting', 'deep conversation'],
                imageUrl: null
            },
            {
                id: 5,
                name: 'Retro Arcade',
                description: 'A fun-filled arcade with classic games and neon lights, perfect for a playful and competitive date.',
                activities: ['arcade games', 'friendly competition', 'pizza', 'nostalgia'],
                imageUrl: null
            },
            {
                id: 6,
                name: 'Art Museum',
                description: 'A modern museum with diverse art collections, offering a cultured experience and plenty to talk about.',
                activities: ['art appreciation', 'gallery viewing', 'discussion', 'cafe visit'],
                imageUrl: null
            }
        ]);
        
        // Game state
        const currentCharacter = ref(null);
        const currentLocation = ref(null);
        const currentDialogue = ref('');
        const currentChoices = ref([]);
        const showChoices = ref(false);
        const previousScreen = ref('mainMenu');
        const gameState = reactive({
            relationships: {}
        });
        
        // Voice synthesis
        const availableVoices = ref([]);
        const femaleVoices = computed(() => {
            return availableVoices.value.filter(voice => voice.name.includes('female') || voice.name.toLowerCase().includes('girl'));
        });
        
        const maleVoices = computed(() => {
            return availableVoices.value.filter(voice => voice.name.includes('male') || voice.name.toLowerCase().includes('boy'));
        });
        
        const neutralVoices = computed(() => {
            return availableVoices.value.filter(voice => 
                !femaleVoices.value.includes(voice) && 
                !maleVoices.value.includes(voice));
        });
        
        // Image generation
        const generateCharacterImage = async (character) => {
            try {
                const prompt = `Portrait of ${character.name}, ${character.shortDescription}. Warm, inviting dating profile picture style with good lighting and friendly expression. Clean background, professional photo quality.`;
                
                const result = await websim.imageGen({
                    prompt: prompt,
                    aspect_ratio: "1:1",
                    seed: character.id * 100
                });
                
                character.imageUrl = result.url;
                return result.url;
            } catch (error) {
                console.error(`Failed to generate image for ${character.name}:`, error);
                return null;
            }
        };
        
        const generateLocationImage = async (location) => {
            try {
                const prompt = `Beautiful view of ${location.name}: ${location.description}. Romantic setting, perfect for a date, inviting atmosphere. Detailed, vibrant colors.`;
                
                const result = await websim.imageGen({
                    prompt: prompt,
                    aspect_ratio: "16:9",
                    seed: location.id * 200
                });
                
                location.imageUrl = result.url;
                return result.url;
            } catch (error) {
                console.error(`Failed to generate image for ${location.name}:`, error);
                return null;
            }
        };
        
        // Initialize game
        const initGame = async () => {
            loadingMessage.value = 'Checking for saved games...';
            loadingProgress.value = 10;
            
            // Check for saved game
            const savedGame = localStorage.getItem('heartJourneySave');
            if (savedGame) {
                try {
                    const parsed = JSON.parse(savedGame);
                    hasSavedGame.value = true;
                    
                    // Restore relationships if available
                    if (parsed.relationships) {
                        gameState.relationships = parsed.relationships;
                    }
                    
                    // Restore settings if available
                    if (parsed.settings) {
                        settings.textToSpeech = parsed.settings.textToSpeech;
                        settings.textSpeed = parsed.settings.textSpeed;
                    }
                    
                    // Restore character memories if available
                    if (parsed.characters) {
                        parsed.characters.forEach(savedChar => {
                            const character = characters.find(c => c.id === savedChar.id);
                            if (character) {
                                character.memory = savedChar.memory || [];
                            }
                        });
                    }
                } catch (e) {
                    console.error('Error loading saved game:', e);
                }
            }
            
            loadingMessage.value = 'Initializing speech synthesis...';
            loadingProgress.value = 30;
            
            // Initialize speech synthesis
            if ('speechSynthesis' in window) {
                // Wait for voices to be loaded
                const voicesLoaded = new Promise(resolve => {
                    const checkVoices = () => {
                        const voices = window.speechSynthesis.getVoices();
                        if (voices.length > 0) {
                            availableVoices.value = voices;
                            resolve();
                        } else {
                            setTimeout(checkVoices, 100);
                        }
                    };
                    checkVoices();
                });
                
                await voicesLoaded;
            }
            
            loadingMessage.value = 'Generating character images...';
            loadingProgress.value = 50;
            
            // Generate character images
            const characterImagePromises = characters.map(character => generateCharacterImage(character));
            await Promise.all(characterImagePromises);
            
            loadingMessage.value = 'Generating location images...';
            loadingProgress.value = 80;
            
            // Generate location images
            const locationImagePromises = locations.map(location => generateLocationImage(location));
            await Promise.all(locationImagePromises);
            
            loadingMessage.value = 'Ready to play!';
            loadingProgress.value = 100;
            
            // Show main menu after a short delay
            setTimeout(() => {
                currentScreen.value = 'mainMenu';
            }, 1000);
        };
        
        // Functions for screen navigation
        const startNewGame = () => {
            currentScreen.value = 'characterSelection';
        };
        
        const continueGame = () => {
            currentScreen.value = 'characterSelection';
        };
        
        const showSettings = () => {
            previousScreen.value = currentScreen.value;
            currentScreen.value = 'settings';
        };
        
        const goToMainMenu = () => {
            currentScreen.value = 'mainMenu';
        };
        
        const goToCharacterSelection = () => {
            currentScreen.value = 'characterSelection';
        };
        
        const goBack = () => {
            currentScreen.value = previousScreen.value;
        };
        
        // Game mechanics
        const selectCharacter = (character) => {
            currentCharacter.value = character;
            currentScreen.value = 'locationSelection';
        };
        
        const selectLocation = async (location) => {
            currentLocation.value = location;
            currentScreen.value = 'gameScreen';
            
            // Start the date
            await startDate();
        };
        
        const startDate = async () => {
            const character = currentCharacter.value;
            const location = currentLocation.value;
            
            // Check if this is the first meeting
            const relationshipKey = `${character.id}`;
            const existingRelationship = gameState.relationships[relationshipKey];
            const isFirstMeeting = !existingRelationship;
            
            // Generate opening dialogue
            let dialoguePrompt = '';
            
            if (isFirstMeeting) {
                dialoguePrompt = `You are ${character.name}, on a first date at ${location.name} with someone you just met. 
                Your personality: ${character.traits.join(', ')}. 
                Your interests: ${character.interests.join(', ')}. 
                Write a friendly opening line introducing yourself. Keep it under 150 characters.`;
            } else {
                // Get the last few memories to use as context
                const recentMemories = character.memory.slice(-3).map(m => m.event).join('. ');
                
                dialoguePrompt = `You are ${character.name}, meeting someone for another date at ${location.name}. 
                Your personality: ${character.traits.join(', ')}. 
                Your interests: ${character.interests.join(', ')}.
                Recent history between you: ${recentMemories}.
                Write a friendly greeting that references your previous interaction. Keep it under 150 characters.`;
            }
            
            try {
                const response = await generateDialogue(dialoguePrompt);
                showDialogue(response);
                
                // Generate choices after the opening dialogue
                await generateChoices();
                
                // If this is the first meeting, create a relationship entry
                if (isFirstMeeting) {
                    gameState.relationships[relationshipKey] = {
                        level: 1,
                        affection: 0,
                        dates: 1
                    };
                    
                    // Add memory of first meeting
                    addToCharacterMemory(character, `Met for the first time at ${location.name}`);
                } else {
                    // Update existing relationship
                    gameState.relationships[relationshipKey].dates += 1;
                    
                    // Add memory of this date
                    addToCharacterMemory(character, `Had another date at ${location.name}`);
                }
                
                // Save game state
                saveGameState();
                
            } catch (error) {
                console.error('Error starting date:', error);
                currentDialogue.value = "Sorry, there was an error. Let's try again.";
            }
        };
        
        const generateDialogue = async (prompt) => {
            try {
                const completion = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "system",
                            content: "You are a dating simulator character speaking directly to the player. Keep your responses under 150 characters, natural, and conversational."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ]
                });
                
                return completion.content;
            } catch (error) {
                console.error('Error generating dialogue:', error);
                return "Hi there! It's nice to meet you. What brings you here today?";
            }
        };
        
        const generateChoices = async () => {
            const character = currentCharacter.value;
            const location = currentLocation.value;
            
            const choicePrompt = `Generate 3 response options for the player talking to ${character.name} at ${location.name}.
            Character interests: ${character.interests.join(', ')}.
            Location activities: ${location.activities.join(', ')}.
            Make the choices distinct, reflecting different approaches (e.g., flirty, friendly, thoughtful).
            Each choice should be under 100 characters.
            
            Respond with JSON in this format:
            {
              "choices": [
                {"text": "Choice 1 text", "type": "friendly"},
                {"text": "Choice 2 text", "type": "flirty"},
                {"text": "Choice 3 text", "type": "thoughtful"}
              ]
            }`;
            
            try {
                const completion = await websim.chat.completions.create({
                    messages: [
                        {
                            role: "user",
                            content: choicePrompt
                        }
                    ],
                    json: true
                });
                
                const response = JSON.parse(completion.content);
                currentChoices.value = response.choices;
                showChoices.value = true;
            } catch (error) {
                console.error('Error generating choices:', error);
                currentChoices.value = [
                    {text: "That sounds interesting! Tell me more about yourself.", type: "friendly"},
                    {text: "I'm really enjoying spending time with you.", type: "flirty"},
                    {text: "What do you think about this place?", type: "thoughtful"}
                ];
                showChoices.value = true;
            }
        };
        
        const makeChoice = async (choiceIndex) => {
            const choice = currentChoices.value[choiceIndex];
            const character = currentCharacter.value;
            const location = currentLocation.value;
            
            // Hide choices while processing
            showChoices.value = false;
            
            // Update relationship based on choice type
            const relationshipKey = `${character.id}`;
            if (gameState.relationships[relationshipKey]) {
                if (choice.type === 'flirty') {
                    gameState.relationships[relationshipKey].affection += 2;
                } else if (choice.type === 'thoughtful') {
                    gameState.relationships[relationshipKey].affection += 1;
                }
                
                // Check for relationship level up
                const currentAffection = gameState.relationships[relationshipKey].affection;
                const currentLevel = gameState.relationships[relationshipKey].level;
                
                if (currentAffection >= currentLevel * 10) {
                    gameState.relationships[relationshipKey].level += 1;
                    
                    // Add memory of relationship progressing
                    addToCharacterMemory(character, `Relationship progressed to level ${gameState.relationships[relationshipKey].level}`);
                }
            }
            
            // Add memory of this choice
            addToCharacterMemory(character, `Player chose: "${choice.text}"`);
            
            // Generate character response to the choice
            const responsePrompt = `You are ${character.name}. The player just said to you: "${choice.text}" 
            while on a date at ${location.name}.
            Your personality: ${character.traits.join(', ')}. 
            Your interests: ${character.interests.join(', ')}.
            The player's approach was ${choice.type}.
            Respond naturally to what they said. Keep it under 150 characters.`;
            
            try {
                const response = await generateDialogue(responsePrompt);
                showDialogue(response);
                
                // Add memory of character's response
                addToCharacterMemory(character, `${character.name} responded: "${response}"`);
                
                // Generate new choices after a delay
                setTimeout(async () => {
                    await generateChoices();
                }, 1000);
                
                // Save game state
                saveGameState();
                
            } catch (error) {
                console.error('Error processing choice:', error);
                currentDialogue.value = "Sorry, there was an error. Let's try again.";
                showChoices.value = true;
            }
        };
        
        const showDialogue = (text) => {
            currentDialogue.value = text;
            
            // Use text-to-speech if enabled
            if (settings.textToSpeech) {
                speakText(text, currentCharacter.value.gender);
            }
        };
        
        const speakText = (text, gender) => {
            if (!('speechSynthesis' in window)) return;
            
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            // Create a new utterance
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Select appropriate voice based on gender
            let selectedVoice = null;
            
            if (gender === 'female' && femaleVoices.value.length > 0) {
                selectedVoice = femaleVoices.value[0];
            } else if (gender === 'male' && maleVoices.value.length > 0) {
                selectedVoice = maleVoices.value[0];
            } else if (neutralVoices.value.length > 0) {
                selectedVoice = neutralVoices.value[0];
            }
            
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            
            // Set rate based on text speed setting
            utterance.rate = 0.8 + (settings.textSpeed * 0.04);
            
            // Speak the text
            window.speechSynthesis.speak(utterance);
        };
        
        // Memory and save system
        const addToCharacterMemory = (character, event) => {
            const memory = {
                event,
                timestamp: new Date().toISOString()
            };
            
            character.memory.push(memory);
            
            // Limit memory to last 20 events
            if (character.memory.length > 20) {
                character.memory = character.memory.slice(-20);
            }
        };
        
        const saveGameState = () => {
            const saveData = {
                relationships: gameState.relationships,
                settings: {
                    textToSpeech: settings.textToSpeech,
                    textSpeed: settings.textSpeed
                },
                characters: characters.map(character => ({
                    id: character.id,
                    memory: character.memory
                }))
            };
            
            localStorage.setItem('heartJourneySave', JSON.stringify(saveData));
        };
        
        const saveSettings = () => {
            saveGameState();
            goBack();
        };
        
        // Watch for settings changes
        watch(settings, () => {
            saveGameState();
        });
        
        // Initialize the game when component is mounted
        onMounted(() => {
            initGame();
        });
        
        return {
            // State
            currentScreen,
            loadingProgress,
            loadingMessage,
            hasSavedGame,
            settings,
            characters,
            locations,
            currentCharacter,
            currentLocation,
            currentDialogue,
            currentChoices,
            showChoices,
            
            // Methods
            startNewGame,
            continueGame,
            showSettings,
            goToMainMenu,
            goToCharacterSelection,
            goBack,
            selectCharacter,
            selectLocation,
            makeChoice,
            saveSettings
        };
    }
}).mount('#app');

