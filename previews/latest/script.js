// Button alerts
document.getElementById('join-btn').addEventListener('click', () => {
    alert('Welcome to PowerGym! Get ready to transform your body!');
});

document.getElementById('send-btn').addEventListener('click', () => {
    alert('Your message has been sent. We will contact you soon!');
});

// Optional: Smooth scrolling for anchor links
const links = document.querySelectorAll('nav ul li a');
links.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        target.scrollIntoView({ behavior: 'smooth' });
    });
});
