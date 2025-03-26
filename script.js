document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('file-name');
    const importBtn = document.getElementById('importBtn');
    const importStatus = document.getElementById('importStatus');
    const roadmapContainer = document.getElementById('roadmap');
    const svg = document.getElementById('arrows');
    
    let courseData = [];
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            fileName.textContent = e.target.files[0].name;
            importBtn.disabled = false;
        } else {
            fileName.textContent = 'No file selected';
            importBtn.disabled = true;
        }
    });
    
    // Handle import button click
    importBtn.addEventListener('click', function() {
        const file = fileInput.files[0];
        if (!file) {
            showImportStatus('Please select a file first.', 'error');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                parseCourseData(content);
                renderRoadmap();
                showImportStatus('Curriculum data imported successfully!', 'success');
            } catch (error) {
                showImportStatus('Error parsing file: ' + error.message, 'error');
                console.error('Import error:', error);
            }
        };
        
        reader.onerror = function() {
            showImportStatus('Error reading file.', 'error');
        };
        
        reader.readAsText(file);
    });
    
    // Parse the course data from text format
    function parseCourseData(text) {
        courseData = [];
        const courseBlocks = text.split('---').filter(block => block.trim() !== '');
        
        courseBlocks.forEach(block => {
            const lines = block.trim().split('\n');
            const course = {};
            
            lines.forEach(line => {
                const [key, value] = line.split(':').map(part => part.trim());
                
                if (key.toLowerCase().includes('course name')) {
                    course.name = value;
                    // Generate a code from the course name
                    course.code = generateCourseCode(value);
                } else if (key.toLowerCase().includes('pre-requirement')) {
                    course.prereqs = value || '';
                } else if (key.toLowerCase().includes('co-requirement')) {
                    course.coreqs = value || '';
                } else if (key.toLowerCase().includes('course semester')) {
                    course.semester = parseInt(value) || 1;
                }
            });
            
            if (course.name) {
                courseData.push(course);
            }
        });
    }
    
    // Generate a course code from the course name
    function generateCourseCode(name) {
        // Extract first letters of main words and add a number
        const words = name.split(' ');
        let code = '';
        words.forEach(word => {
            if (word.length > 0 && !['and', 'the', 'of', 'in', 'for', 'to'].includes(word.toLowerCase())) {
                code += word[0].toUpperCase();
            }
        });
        // Add a random number to make it unique
        code += Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return code;
    }
    
    // Show import status message
    function showImportStatus(message, type) {
        importStatus.textContent = message;
        importStatus.className = 'import-status ' + type;
        
        // Hide message after a few seconds if it's a success
        if (type === 'success') {
            setTimeout(() => {
                importStatus.style.display = 'none';
            }, 5000);
        }
    }
    
    // Render the roadmap based on course data
    function renderRoadmap() {
        // Clear the roadmap
        roadmapContainer.innerHTML = '';
        
        if (courseData.length === 0) {
            roadmapContainer.innerHTML = `
                <div class="empty-state">
                    <p>No curriculum data loaded.</p>
                    <p>Import a course data file to view the roadmap.</p>
                </div>
            `;
            return;
        }
        
        // Find the maximum semester number
        const maxSemester = Math.max(...courseData.map(course => course.semester));
        
        // Create semester containers
        for (let i = 1; i <= maxSemester; i++) {
            const semesterDiv = document.createElement('div');
            semesterDiv.className = 'semester';
            semesterDiv.innerHTML = `<h3>Semester ${i}</h3>`;
            roadmapContainer.appendChild(semesterDiv);
        }
        
        // Add courses to their respective semesters
        courseData.forEach(course => {
            const courseDiv = document.createElement('div');
            courseDiv.className = 'course not-taken';
            courseDiv.id = course.code;
            courseDiv.setAttribute('data-prereqs', course.prereqs || '');
            courseDiv.setAttribute('data-coreqs', course.coreqs || '');
            
            courseDiv.innerHTML = `
                <div class="course-code">${course.code}</div>
                <div class="course-name">${course.name}</div>
                <div class="credits"></div>
            `;
            
            // Find the correct semester container
            const semesterIndex = course.semester - 1;
            if (semesterIndex >= 0 && semesterIndex < maxSemester) {
                const semesters = document.querySelectorAll('.semester');
                semesters[semesterIndex].appendChild(courseDiv);
            }
        });
        
        // Initialize course events and arrows
        initializeCourseEvents();
        updateSVGDimensions();
        addArrowMarker();
        createArrows();
    }
    
    // Initialize course events
    function initializeCourseEvents() {
        const courses = document.querySelectorAll('.course');
        
        courses.forEach(course => {
            // Randomly assign status for demo purposes
            const statuses = ['approved', 'in-progress', 'failed', 'not-taken'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            course.classList.remove('not-taken');
            course.classList.add(randomStatus);
            
            // Add hover events
            course.addEventListener('mouseenter', function() {
                // Highlight current course
                this.classList.add('highlight');
                
                // Get prerequisites and highlight them
                const prereqIds = this.getAttribute('data-prereqs').split(',');
                prereqIds.forEach(prereqId => {
                    if (prereqId.trim() !== '') {
                        // Find course by name or code
                        const prereq = findCourseByNameOrCode(prereqId.trim());
                        if (prereq) {
                            prereq.classList.add('prerequisite');
                        }
                    }
                });
                
                // Get corequisites and highlight them
                const coreqIds = this.getAttribute('data-coreqs').split(',');
                coreqIds.forEach(coreqId => {
                    if (coreqId.trim() !== '') {
                        const coreq = findCourseByNameOrCode(coreqId.trim());
                        if (coreq) {
                            coreq.classList.add('corequisite');
                        }
                    }
                });
                
                // Find courses that have this course as a prerequisite
                courses.forEach(otherCourse => {
                    const otherPrereqs = otherCourse.getAttribute('data-prereqs').split(',');
                    if (otherPrereqs.some(prereq => 
                        prereq.trim() === this.id || 
                        prereq.trim() === this.querySelector('.course-name').textContent
                    )) {
                        otherCourse.classList.add('postrequisite');
                    }
                });
                
                // Show relevant arrows
                const arrows = svg.querySelectorAll('path');
                arrows.forEach(arrow => {
                    if (arrow.getAttribute('data-from') === this.id || 
                        arrow.getAttribute('data-to') === this.id) {
                        arrow.classList.add('visible');
                    }
                });
            });
            
            course.addEventListener('mouseleave', function() {
                // Remove all highlights
                courses.forEach(c => {
                    c.classList.remove('highlight', 'prerequisite', 'postrequisite', 'corequisite');
                });
                
                // Hide all arrows
                const arrows = svg.querySelectorAll('path');
                arrows.forEach(arrow => {
                    arrow.classList.remove('visible');
                });
            });
        });
    }
    
    // Find a course element by name or code
    function findCourseByNameOrCode(nameOrCode) {
        // First try to find by ID (code)
        let course = document.getElementById(nameOrCode);
        
        // If not found, try to find by course name
        if (!course) {
            const courses = document.querySelectorAll('.course');
            for (let i = 0; i < courses.length; i++) {
                if (courses[i].querySelector('.course-name').textContent.trim() === nameOrCode) {
                    course = courses[i];
                    break;
                }
            }
        }
        
        return course;
    }
    
    // Update SVG dimensions
    function updateSVGDimensions() {
        const container = document.querySelector('.container');
        svg.setAttribute('width', container.scrollWidth);
        svg.setAttribute('height', container.scrollHeight);
    }
    
    // Add arrowhead marker
    function addArrowMarker() {
        // Clear existing defs
        const existingDefs = svg.querySelector('defs');
        if (existingDefs) {
            svg.removeChild(existingDefs);
        }
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Prerequisite arrow marker
        const prereqMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        prereqMarker.setAttribute('id', 'prereq-arrowhead');
        prereqMarker.setAttribute('markerWidth', '10');
        prereqMarker.setAttribute('markerHeight', '7');
        prereqMarker.setAttribute('refX', '10');
        prereqMarker.setAttribute('refY', '3.5');
        prereqMarker.setAttribute('orient', 'auto');
        
        const prereqPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        prereqPolygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        prereqPolygon.setAttribute('fill', '#2196f3');
        
        prereqMarker.appendChild(prereqPolygon);
        
        // Corequisite arrow marker
        const coreqMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        coreqMarker.setAttribute('id', 'coreq-arrowhead');
        coreqMarker.setAttribute('markerWidth', '10');
        coreqMarker.setAttribute('markerHeight', '7');
        coreqMarker.setAttribute('refX', '10');
        coreqMarker.setAttribute('refY', '3.5');
        coreqMarker.setAttribute('orient', 'auto');
        
        const coreqPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        coreqPolygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        coreqPolygon.setAttribute('fill', '#9c27b0');
        
        coreqMarker.appendChild(coreqPolygon);
        
        defs.appendChild(prereqMarker);
        defs.appendChild(coreqMarker);
        svg.appendChild(defs);
    }
    
    // Create arrows for all relationships
    function createArrows() {
        // Clear existing arrows except markers
        const existingPaths = svg.querySelectorAll('path');
        existingPaths.forEach(path => {
            svg.removeChild(path);
        });
        
        const courses = document.querySelectorAll('.course');
        
        courses.forEach(course => {
            // Create prerequisite arrows
            const prereqs = course.getAttribute('data-prereqs');
            if (prereqs) {
                const prereqIds = prereqs.split(',');
                prereqIds.forEach(prereqId => {
                    if (prereqId.trim() !== '') {
                        const prereq = findCourseByNameOrCode(prereqId.trim());
                        if (prereq) {
                            const arrow = createArrow(prereq, course, 'prereq');
                            svg.appendChild(arrow);
                        }
                    }
                });
            }
            
            // Create corequisite arrows
            const coreqs = course.getAttribute('data-coreqs');
            if (coreqs) {
                const coreqIds = coreqs.split(',');
                coreqIds.forEach(coreqId => {
                    if (coreqId.trim() !== '') {
                        const coreq = findCourseByNameOrCode(coreqId.trim());
                        if (coreq) {
                            const arrow = createArrow(course, coreq, 'coreq');
                            svg.appendChild(arrow);
                        }
                    }
                });
            }
        });
    }
    
    // Create an arrow path between two elements
    function createArrow(from, to, type) {
        const fromRect = from.getBoundingClientRect();
        const toRect = to.getBoundingClientRect();
        const containerRect = document.querySelector('.container').getBoundingClientRect();
        
        // Calculate positions relative to the container
        const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
        const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top + toRect.height / 2 - containerRect.top;
        
        // Create path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate control points for a curved path
        const dx = toX - fromX;
        const dy = toY - fromY;
        const controlX1 = fromX + dx / 3;
        const controlY1 = fromY + dy / 3;
        const controlX2 = fromX + dx * 2 / 3;
        const controlY2 = fromY + dy * 2 / 3;
        
        // Set path data
        path.setAttribute('d', `M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`);
        path.setAttribute('marker-end', `url(#${type}-arrowhead)`);
        path.setAttribute('data-from', from.id);
        path.setAttribute('data-to', to.id);
        path.classList.add('arrow');
        path.classList.add(type);
        
        return path;
    }
    
    // Initialize with empty state
    renderRoadmap();
    
    // Handle window resize events
    window.addEventListener('resize', function() {
        updateSVGDimensions();
        createArrows();
    });
    
    // Handle roadmap scroll events
    roadmapContainer.addEventListener('scroll', createArrows);
});
