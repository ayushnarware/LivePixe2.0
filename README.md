# LivePixe 2.0 - Ultimate Stock Media Engine 📸

**LivePixe 2.0** is a modern, responsive, and feature-rich stock photography and video search engine built using vanilla JavaScript, HTML5, and CSS3. It consumes the **Pexels API** to provide high-quality royalty-free assets to users with a seamless UI/UX.

---

## 🚀 Features

### 🔍 **Search & Discovery**
- **Dual Media Support:** Switch seamlessly between **Photos** and **Videos**.
- **Smart Search:** Search for any topic (e.g., Nature, Technology, Dark Mood).
- **Infinite Scroll:** Automatically loads more content as you scroll down.
- **Trending Tags:** Quick access chips for popular categories.

### 🎨 **UI & Customization**
- **Responsive Masonry Grid:**
  - 4 Columns on large screens.
  - **2 Columns on mobile** for a better viewing experience.
- **Dark/Light Mode:** Toggle between themes with a single click. Preferences are saved in local storage.
- **Mobile-First Design:**
  - Custom Hamburger Menu with a slide-out drawer for filters.
  - Optimized header layout for small screens.

### 🛠 **Advanced Filters**
- **Orientation:** Filter by Landscape, Portrait, or Square.
- **Color Search:** Find images matching specific color tones (Red, Blue, Black, etc.).

### 💾 **Save & Interact**
- **Save to Collection:** "Heart/Save" button to bookmark your favorite assets locally.
- **Saved Items Drawer:** View and manage your saved items.
- **Remove Items:** Easily delete items from your saved collection.
- **Image Details Modal:**
  - View high-res previews.
  - See photographer/creator details.
  - **Similar Images:** Automatically fetches and displays related images below the details.
  - **Download:** One-click download button.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Flexbox & Grid), JavaScript (ES6+)
- **API:** [Pexels API](https://www.pexels.com/api/)
- **Icons:** [Phosphor Icons](https://phosphoricons.com/)
- **Fonts:** [Inter (Google Fonts)](https://fonts.google.com/specimen/Inter)

---

## 📂 Project Structure

```text
LivePixe2.0/
│
├── index.html      # Main HTML structure
├── style.css       # All styling (Responsive, Dark Mode, Animations)
├── script.js       # Logic (API fetch, Modal, Search, Saved Items)
└── README.md       # Project documentation
