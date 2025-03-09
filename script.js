document.addEventListener('DOMContentLoaded', function() {
    const courses = document.querySelectorAll('.course');
    const svg = document.getElementById('arrows');
    
    // Update SVG dimensions when window resizes
    function updateSVGDimensions() {
        const container = document.querySelector('.container');
        svg.setAttribute('width', container.scrollWidth);
        svg.setAttribute('height', container.scrollHeight);
    }
    
    window.addEventListener('resize', updateSVGDimensions);
    updateSVGDimensions();
    
    // Initialize course status (random for demo purposes)
    courses.forEach(course => {
        const statuses = ['approved', 'in-progress', 'failed', 'not-taken'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        course.classList.add(randomStatus);
    });
    
    // Create arrows for prerequisites
    function createArrows() {
        // Clear existing arrows
        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }
        
        courses.forEach(course => {
            const prereqs = course.getAttribute('data-prereqs');
            if (prereqs) {
                const prereqIds = prereqs.split(',');
                prereqIds.forEach(prereqId => {
                    if (prereqId.trim() !== '') {
                        const prereq = document.getElementById(prereqId.trim());
                        if (prereq) {
                            const arrow = createArrow(prereq, course);
                            svg.appendChild(arrow);
                        }
                    }
                });
            }
        });
    }
    
    // Create an arrow path between two elements
    function createArrow(from, to) {
        const fromRect = from.getBoundingClientRect();
        const toRect = to.getBoundingClientRect();
        const containerRect = document.querySelector('.container').getBoundingClientRect();
        
        // Calculate positions relative to the container
        const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
        const fromY = fromRect.top + fromRect.height - containerRect.top;
        const toX = toRect.left + toRect.width / 2 - containerRect.left;
        const toY = toRect.top - containerRect.top;
        
        // Create path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate control points for a curved path
        const controlX1 = fromX;
        const controlY1 = fromY + (toY - fromY) / 3;
        const controlX2 = toX;
        const controlY2 = toY - (toY - fromY) / 3;
        
        // Set path data
        path.setAttribute('d', `M ${fromX} ${fromY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${toX} ${toY}`);
        path.setAttribute('marker-end', 'url(#arrowhead)');
        path.setAttribute('data-from', from.id);
        path.setAttribute('data-to', to.id);
        path.classList.add('arrow');
        
        return path;
    }
    
    // Add arrowhead marker
    function addArrowMarker() {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '10');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', '#ff9800');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);
    }
    
    // Handle course hover events
    courses.forEach(course => {
        course.addEventListener('mouseenter', function() {
            // Highlight current course
            this.classList.add('highlight');
            
            // Get prerequisites and highlight them
            const prereqIds = this.getAttribute('data-prereqs').split(',');
            prereqIds.forEach(prereqId => {
                if (prereqId.trim() !== '') {
                    const prereq = document.getElementById(prereqId.trim());
                    if (prereq) {
                        prereq.classList.add('prerequisite');
                    }
                }
            });
            
            // Find courses that have this course as a prerequisite
            courses.forEach(otherCourse => {
                const otherPrereqs = otherCourse.getAttribute('data-prereqs').split(',');
                if (otherPrereqs.includes(this.id)) {
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
                c.classList.remove('highlight', 'prerequisite', 'postrequisite');
            });
            
            // Hide all arrows
            const arrows = svg.querySelectorAll('path');
            arrows.forEach(arrow => {
                arrow.classList.remove('visible');
            });
        });
    });
    
    // Initialize
    addArrowMarker();
    createArrows();
    
    // Recalculate arrows when scrolling (for large curricula that require scrolling)
    document.querySelector('.roadmap').addEventListener('scroll', createArrows);
});