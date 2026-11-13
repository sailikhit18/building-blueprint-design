(() => {
  "use strict";
  const STORAGE = {
    user: "blueprint-user",
    requirements: "blueprint-requirements",
    project: "blueprint-project",
    projects: "blueprint-projects"
  };
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const toast = (message) => {
    const el = document.querySelector(".toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("visible");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("visible"), 3000);
  };

  document.querySelectorAll(".menu-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const nav = document.querySelector(".main-nav, .app-nav");
      if (!nav) return;
      const open = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    });
  });

  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.parentElement.querySelector("input");
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.textContent = showing ? "Show" : "Hide";
      button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });

  document.querySelectorAll("[data-demo-message]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      toast(link.dataset.demoMessage);
    });
  });

  document.querySelectorAll('[data-form="signup"], [data-form="login"]').forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const message = form.querySelector(".form-message");
      message.textContent = "";
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const email = String(data.get("email")).trim().toLowerCase();
      const password = String(data.get("password"));
      if (form.dataset.form === "signup") {
        const name = String(data.get("name")).trim();
        if (password !== data.get("confirmPassword")) {
          message.textContent = "Those passwords don’t match yet. Please check and try again.";
          form.querySelector('[name="confirmPassword"]').focus();
          return;
        }
        write(STORAGE.user, { name, email, password });
        toast("Your account is ready. Welcome to Blueprint Designer!");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 500);
        return;
      }
      const savedUser = read(STORAGE.user, null);
      if (savedUser && savedUser.email === email && savedUser.password !== password) {
        message.textContent = "That password doesn’t match this demo account.";
        return;
      }
      if (savedUser && savedUser.email !== email) {
        message.textContent = "No demo account was found for this email. You can create one in a moment.";
        return;
      }
      if (!savedUser) write(STORAGE.user, { name: email.split("@")[0].replace(/[._-]/g, " "), email });
      window.location.href = "dashboard.html";
    });
  });

  const user = read(STORAGE.user, null);
  if (user) {
    document.querySelectorAll("[data-user-name]").forEach((el) => { el.textContent = (user.name || "friend").split(" ")[0]; });
    document.querySelectorAll(".user-name").forEach((el) => { el.textContent = user.name || user.email || "Your account"; });
    document.querySelectorAll(".user-avatar").forEach((el) => { el.textContent = (user.name || user.email || "A").trim().charAt(0).toUpperCase(); });
  }
  const projects = read(STORAGE.projects, []);
  document.querySelectorAll("[data-project-count]").forEach((el) => {
    el.textContent = String(Math.max(3, projects.length)).padStart(2, "0");
  });

  const reqForm = document.querySelector('[data-form="requirements"]');
  if (reqForm) {
    const saved = read(STORAGE.requirements, null);
    if (saved) {
      ["width", "length", "bedrooms", "bathrooms"].forEach((name) => {
        if (saved[name] != null) reqForm.elements[name].value = saved[name];
      });
      ["parking", "balcony"].forEach((name) => { reqForm.elements[name].checked = Boolean(saved[name]); });
    }
    reqForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const msg = reqForm.querySelector(".form-message");
      msg.textContent = "";
      if (!reqForm.reportValidity()) return;
      const width = Number(reqForm.elements.width.value);
      const length = Number(reqForm.elements.length.value);
      if (width < 15 || length < 15 || width > 200 || length > 200) {
        msg.textContent = "Please enter plot dimensions between 15 and 200 feet.";
        return;
      }
      const requirements = {
        width, length,
        bedrooms: Number(reqForm.elements.bedrooms.value),
        bathrooms: Number(reqForm.elements.bathrooms.value),
        parking: reqForm.elements.parking.checked,
        balcony: reqForm.elements.balcony.checked
      };
      write(STORAGE.requirements, requirements);
      window.location.href = "templates.html";
    });
  }

  const templateCards = document.querySelectorAll("[data-template-card]");
  if (templateCards.length) {
    const requirements = read(STORAGE.requirements, { width: 40, length: 60, bedrooms: 2, bathrooms: 2, parking: false, balcony: true });
    const summary = document.querySelector("[data-requirement-summary]");
    if (summary) {
      summary.innerHTML = `${requirements.width} × ${requirements.length} ft plot <span>·</span> ${requirements.bedrooms} ${requirements.bedrooms === 1 ? "bedroom" : "bedrooms"} <span>·</span> ${requirements.bathrooms} ${requirements.bathrooms === 1 ? "bathroom" : "bathrooms"}`;
    }
    const targetBedrooms = Math.min(3, Math.max(1, Number(requirements.bedrooms) || 1));
    const targetBathrooms = Math.min(3, Math.max(1, Number(requirements.bathrooms) || 1));
    const selected = [1, 2, 3].sort((a, b) =>
      (Math.abs(a - targetBedrooms) * 2 + Math.abs(Math.min(a, 2) - targetBathrooms)) -
      (Math.abs(b - targetBedrooms) * 2 + Math.abs(Math.min(b, 2) - targetBathrooms))
    )[0];
    templateCards.forEach((card) => {
      const match = Number(card.dataset.templateCard) === selected;
      card.classList.toggle("recommended", match);
      const ribbon = card.querySelector(".recommend-ribbon");
      if (match && !ribbon) {
        const label = document.createElement("div");
        label.className = "recommend-ribbon";
        label.textContent = "✳ CLOSEST MATCH";
        card.prepend(label);
      } else if (!match && ribbon) ribbon.remove();
      const button = card.querySelector(".select-template");
      const specs = card.querySelector(".template-specs");
      if (specs) specs.innerHTML = specs.innerHTML.replace(/\d+ bathrooms?/, `${targetBathrooms} ${targetBathrooms === 1 ? "bathroom" : "bathrooms"}`);
      button.classList.toggle("btn-dark", match);
      button.classList.toggle("btn-outline", !match);
    });
    document.querySelectorAll(".select-template").forEach((button) => {
      button.addEventListener("click", () => {
        const selectedTemplate = Number(button.dataset.template);
        const project = {
          title: selectedTemplate === 1 ? "The Little Nest" : selectedTemplate === 2 ? "The Sunday House" : "The Open Meadow",
          template: selectedTemplate,
          requirements,
          rooms: buildTemplateRooms(selectedTemplate, requirements),
          updated: new Date().toISOString()
        };
        write(STORAGE.project, project);
        const allProjects = read(STORAGE.projects, []);
        const existing = allProjects.findIndex((item) => item.title === project.title);
        if (existing >= 0) allProjects[existing] = project;
        else allProjects.unshift(project);
        write(STORAGE.projects, allProjects);
        window.location.href = "editor.html";
      });
    });
  }

  function buildTemplateRooms(template, requirements) {
    const layouts = {
      1: [
        ["Living room", "living", 1, 1, 8, 6], ["Kitchen", "kitchen", 9, 1, 5, 4],
        ["Bedroom", "bedroom", 1, 7, 7, 6], ["Bathroom", "bathroom", 9, 6, 4, 4]
      ],
      2: [
        ["Living room", "living", 1, 1, 8, 6], ["Kitchen", "kitchen", 9, 1, 5, 4],
        ["Bedroom", "bedroom", 1, 7, 7, 6], ["Bedroom", "bedroom", 9, 6, 6, 6],
        ["Bathroom", "bathroom", 9, 12, 4, 4], ["Bathroom", "bathroom", 14, 1, 4, 4]
      ],
      3: [
        ["Living room", "living", 1, 1, 8, 6], ["Kitchen", "kitchen", 9, 1, 5, 4],
        ["Bedroom", "bedroom", 1, 7, 7, 6], ["Bedroom", "bedroom", 9, 6, 6, 6],
        ["Bedroom", "bedroom", 1, 14, 7, 6], ["Bathroom", "bathroom", 9, 12, 4, 4],
        ["Bathroom", "bathroom", 14, 1, 4, 4]
      ]
    };
    const rooms = (layouts[template] || layouts[2]).filter((room) => room[1] !== "bathroom").map((room, index) => ({
      id: `${room[1]}-${index + 1}`, name: room[0], type: room[1],
      x: room[2], y: room[3], w: room[4], h: room[5], door: true
    }));
    const bathroomCount = Math.min(3, Math.max(1, Number(requirements.bathrooms) || 1));
    const gridWidth = Math.max(1, Math.ceil(Number(requirements.width || 40) / 2));
    const gridHeight = Math.max(1, Math.ceil(Number(requirements.length || 60) / 2));
    for (let index = 0; index < bathroomCount; index++) {
      const bathroom = {
        id: `bathroom-${index + 1}`, name: "Bathroom", type: "bathroom",
        x: index === 0 ? 9 : index === 1 ? 14 : 15,
        y: index === 0 ? 12 : index === 1 ? 1 : 7,
        w: 4, h: 4, door: true
      };
      if (bathroom.x + bathroom.w > gridWidth || bathroom.y + bathroom.h > gridHeight ||
          rooms.some((room) => bathroom.x < room.x + room.w && bathroom.x + bathroom.w > room.x && bathroom.y < room.y + room.h && bathroom.y + bathroom.h > room.y)) {
        Object.assign(bathroom, findOpenSpot(4, 4));
      }
      rooms.push(bathroom);
    }
    if (requirements.parking) {
      rooms.push({ id: "parking-1", name: "Parking", type: "parking", ...findOpenSpot(5, 5), w: 5, h: 5, door: true });
    }
    if (requirements.balcony) {
      rooms.push({ id: "balcony-1", name: "Balcony", type: "balcony", ...findOpenSpot(5, 3), w: 5, h: 3, door: true });
    }
    return rooms;

    function findOpenSpot(w, h) {
      for (let y = 0; y <= gridHeight - h; y++) for (let x = 0; x <= gridWidth - w; x++) {
        const free = rooms.every((room) => x + w <= room.x || x >= room.x + room.w || y + h <= room.y || y >= room.y + room.h);
        if (free) return { x, y };
      }
      return { x: 0, y: Math.min(Math.max(0, gridHeight - h), rooms.reduce((max, room) => Math.max(max, room.y + room.h), 0)) };
    }
  }

  if (document.querySelector("#floorplan-canvas")) initEditor();

  function initEditor() {
    const canvas = document.querySelector("#floorplan-canvas");
    const project = read(STORAGE.project, null);
    let rooms = project && project.rooms ? project.rooms : Array.from(canvas.querySelectorAll(".canvas-room")).map((el) => ({
      id: el.dataset.roomId, name: el.dataset.roomName, type: (el.className.match(/room-([a-z]+)-block/) || [])[1] || "living",
      x: parseInt(el.style.getPropertyValue("--x"), 10), y: parseInt(el.style.getPropertyValue("--y"), 10),
      w: parseInt(el.style.getPropertyValue("--w"), 10), h: parseInt(el.style.getPropertyValue("--h"), 10),
      door: !el.classList.contains("no-door")
    }));
    let selectedId = rooms[0]?.id || null;
    let zoom = 100;
    let gridVisible = true;
    let history = [];
    let historyIndex = -1;
    let dragging = null;
    let doorMode = false;
    const titleEl = document.querySelector("[data-project-title]");
    if (project?.title && titleEl) titleEl.textContent = project.title;
    if (project?.requirements) {
      document.querySelector("[data-plot-width]").textContent = project.requirements.width;
      document.querySelector("[data-plot-length]").textContent = project.requirements.length;
    }
    const plotWidth = Math.max(1, Math.ceil(Number(project?.requirements?.width || 40) / 2));
    const plotHeight = Math.max(1, Math.ceil(Number(project?.requirements?.length || 60) / 2));
    canvas.style.setProperty("--cols", plotWidth);
    canvas.style.setProperty("--rows", plotHeight);
    const clone = (value) => JSON.parse(JSON.stringify(value));
    function saveHistory() {
      const snapshot = JSON.stringify(rooms);
      if (history[historyIndex] === snapshot) return;
      history = history.slice(0, historyIndex + 1);
      history.push(snapshot);
      historyIndex = history.length - 1;
      updateHistoryButtons();
    }
    function updateHistoryButtons() {
      document.querySelector("[data-undo]").disabled = historyIndex <= 0;
      document.querySelector("[data-redo]").disabled = historyIndex >= history.length - 1;
    }
    function commit(message) {
      saveHistory();
      persist();
      render();
      if (message) toast(message);
    }
    function persist() {
      const current = read(STORAGE.project, {}) || {};
      const next = { ...current, title: titleEl?.textContent || "My home design", rooms, updated: new Date().toISOString() };
      write(STORAGE.project, next);
      const all = read(STORAGE.projects, []);
      const index = all.findIndex((item) => item.title === current.title || item.title === next.title);
      if (index >= 0) all[index] = next;
      else all.unshift(next);
      write(STORAGE.projects, all);
      const state = document.querySelector("[data-save-state]");
      if (state) state.textContent = "All changes saved";
    }
    function typeClass(type) {
      return ({ "Living room": "living", living: "living", Kitchen: "kitchen", kitchen: "kitchen", Bedroom: "bedroom", bedroom: "bedroom", Bathroom: "bathroom", bathroom: "bathroom", Balcony: "balcony", balcony: "balcony", Parking: "parking", parking: "parking" })[type] || "bedroom";
    }
    function render() {
      canvas.querySelectorAll(".canvas-room").forEach((el) => el.remove());
      rooms.forEach((room) => {
        const el = document.createElement("div");
        el.className = `canvas-room room-${typeClass(room.type)}-block${room.door ? "" : " no-door"}${room.id === selectedId ? " selected" : ""}`;
        el.dataset.roomId = room.id;
        el.dataset.roomName = room.name;
        el.style.cssText = `--x:${room.x};--y:${room.y};--w:${room.w};--h:${room.h}`;
        el.innerHTML = `<span class="room-name"></span><span class="room-size"></span><span class="room-grip">⠿</span><span class="room-door" aria-label="Door"></span>`;
        el.querySelector(".room-name").textContent = room.name;
        el.querySelector(".room-size").textContent = `${room.w * 2}' × ${room.h * 2}'`;
        el.addEventListener("pointerdown", (event) => {
          if (doorMode) {
            room.door = !room.door;
            commit(room.door ? "Door added." : "Door removed.");
            return;
          }
          selectedId = room.id;
          updateSelection();
          if (event.button !== 0) return;
          const rect = canvas.getBoundingClientRect();
          const cell = 22 * zoom / 100;
          dragging = { id: room.id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: room.x, y: room.y, cell, rect };
          el.setPointerCapture(event.pointerId);
        });
        el.addEventListener("pointermove", (event) => {
          if (!dragging || dragging.id !== room.id || dragging.pointerId !== event.pointerId) return;
          room.x = clamp(dragging.x + Math.round((event.clientX - dragging.startX) / dragging.cell), 0, plotWidth - room.w);
          room.y = clamp(dragging.y + Math.round((event.clientY - dragging.startY) / dragging.cell), 0, plotHeight - room.h);
          el.style.setProperty("--x", room.x);
          el.style.setProperty("--y", room.y);
          updateValidation();
        });
        el.addEventListener("pointerup", (event) => {
          if (!dragging || dragging.id !== room.id || dragging.pointerId !== event.pointerId) return;
          const moved = room.x !== dragging.x || room.y !== dragging.y;
          dragging = null;
          if (moved) commit();
        });
        canvas.append(el);
      });
      document.querySelector("[data-canvas-room-count]").textContent = `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}`;
      document.querySelector(".canvas-empty-hint").hidden = rooms.length > 0;
      updateSelection();
      updateValidation();
      updateHistoryButtons();
    }
    function updateSelection() {
      canvas.querySelectorAll(".canvas-room").forEach((el) => el.classList.toggle("selected", el.dataset.roomId === selectedId));
      const selected = rooms.find((room) => room.id === selectedId) || rooms[0];
      if (selected) {
        selectedId = selected.id;
        document.querySelector("[data-selected-title]").textContent = selected.name;
        document.querySelector('[data-property="name"]').value = selected.name;
        document.querySelector('[data-property="width"]').value = selected.w * 2;
        document.querySelector('[data-property="height"]').value = selected.h * 2;
        document.querySelector("[data-room-area]").textContent = `${selected.w * selected.h * 4} sq ft`;
        document.querySelector("[data-door-state]").textContent = selected.door ? "Door included" : "No door";
        document.querySelector(".door-switch").classList.toggle("on", selected.door);
      }
    }
    function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
    function validate() {
      const rules = [];
      const overlaps = rooms.some((room, i) => rooms.slice(i + 1).some((other) =>
        room.x < other.x + other.w && room.x + room.w > other.x && room.y < other.y + other.h && room.y + room.h > other.y
      ));
      rules.push({ id: "R1", name: "No room overlap", status: overlaps ? "fail" : "pass", detail: overlaps ? "Some rooms occupy the same part of the plan." : "Every room has its own clear footprint.", threshold: "Rooms should not overlap.", fix: overlaps ? "Move the overlapping rooms apart." : "", action: "overlap" });
      const outside = rooms.some((room) => room.x < 0 || room.y < 0 || room.x + room.w > plotWidth || room.y + room.h > plotHeight);
      rules.push({ id: "R2", name: "Inside the plot", status: outside ? "fail" : "pass", detail: outside ? "A room extends beyond the plot boundary." : "All rooms fit within the plot.", threshold: `Plot: ${plotWidth * 2} × ${plotHeight * 2} ft.`, fix: outside ? "Move the room back inside the plot." : "", action: "inside" });
      const tooSmall = rooms.some((room) => room.w * room.h * 4 < 36);
      rules.push({ id: "R3", name: "Minimum room area", status: tooSmall ? "warning" : "pass", detail: tooSmall ? "A room is smaller than the suggested minimum." : "Every room meets the suggested area.", threshold: "Suggested minimum: 36 sq ft.", fix: tooSmall ? "Increase the room dimensions." : "", action: "area" });
      const tooNarrow = rooms.some((room) => Math.min(room.w, room.h) * 2 < 6);
      rules.push({ id: "R4", name: "Minimum room width", status: tooNarrow ? "warning" : "pass", detail: tooNarrow ? "A room may feel narrow for everyday use." : "Every room meets the suggested width.", threshold: "Suggested minimum width: 6 ft.", fix: tooNarrow ? "Widen the room to at least 6 ft." : "", action: "width" });
      const noDoor = rooms.some((room) => !room.door);
      rules.push({ id: "R5", name: "Room access", status: noDoor ? "warning" : "pass", detail: noDoor ? "At least one room has no door marked." : "Every room has a doorway marked.", threshold: "Suggested: each room has a door.", fix: noDoor ? "Add a doorway to rooms without one." : "", action: "door" });
      const hasKitchen = rooms.some((room) => typeClass(room.type) === "kitchen");
      const hasLiving = rooms.some((room) => typeClass(room.type) === "living");
      const missing = [];
      if (!hasKitchen) missing.push("kitchen");
      if (!hasLiving) missing.push("living room");
      rules.push({ id: "R6", name: "Essential rooms", status: missing.length ? "fail" : "pass", detail: missing.length ? `Your plan still needs a ${missing.join(" and ")}.` : "Your plan includes a kitchen and living room.", threshold: "One kitchen and one living room.", fix: missing.length ? "Add the missing room from the palette." : "", action: "required" });
      return rules;
    }
    function updateValidation() {
      const rules = validate();
      const passes = rules.filter((rule) => rule.status === "pass").length;
      document.querySelectorAll("[data-validation-score]").forEach((el) => { el.textContent = `${passes}/6`; });
      const warnings = rules.filter((rule) => rule.status !== "pass").length;
      document.querySelector("[data-validation-summary]").textContent = warnings ? "A few little things to look at. You’re close." : "Looking good. Your design passes all six checks.";
      document.querySelector("[data-issue-count]").textContent = String(warnings);
      document.querySelector("[data-rule-mini-list]").innerHTML = rules.map((rule) =>
        `<div class="rule-mini rule-${rule.status}"><span class="rule-icon">${rule.status === "pass" ? "✓" : rule.status === "warning" ? "!" : "×"}</span><span>${rule.id} · ${rule.name}</span></div>`
      ).join("");
      document.querySelector("[data-validation-rules]").innerHTML = rules.map((rule) => {
        const label = rule.status === "pass" ? "Passed" : rule.status === "warning" ? "Warning" : "Needs attention";
        return `<article class="validation-rule"><div class="validation-rule-head"><strong>${rule.id} · ${rule.name}</strong><span class="rule-status ${rule.status}">${label}</span></div><p>${rule.detail}</p><small class="rule-threshold">${rule.threshold}</small>${rule.fix ? `<button class="rule-fix" data-fix="${rule.action}">✳ ${rule.fix}</button>` : ""}</article>`;
      }).join("");
      document.querySelectorAll("[data-fix]").forEach((button) => button.addEventListener("click", () => applyFix(button.dataset.fix)));
    }
    function applyFix(action) {
      if (action === "door") rooms.forEach((room) => { room.door = true; });
      if (action === "width") rooms.forEach((room) => {
        if (Math.min(room.w, room.h) < 3) {
          if (room.w < 3 && room.x + 3 <= plotWidth) room.w = 3;
          if (room.h < 3 && room.y + 3 <= plotHeight) room.h = 3;
        }
      });
      if (action === "area") rooms.forEach((room) => {
        if (room.w * room.h < 9) {
          room.w = Math.max(room.w, 3);
          room.h = Math.max(room.h, 3);
          room.x = Math.min(room.x, plotWidth - room.w);
          room.y = Math.min(room.y, plotHeight - room.h);
        }
      });
      if (action === "inside") rooms.forEach((room) => { room.x = clamp(room.x, 0, plotWidth - room.w); room.y = clamp(room.y, 0, plotHeight - room.h); });
      if (action === "overlap") {
        rooms.forEach((room, index) => {
          if (rooms.slice(0, index).some((other) => room.x < other.x + other.w && room.x + room.w > other.x && room.y < other.y + other.h && room.y + room.h > other.y)) {
            room.x = 0;
            room.y = Math.min(plotHeight - room.h, rooms.slice(0, index).reduce((max, other) => Math.max(max, other.y + other.h), 0) + 1);
          }
        });
      }
      if (action === "required") {
        if (!rooms.some((room) => typeClass(room.type) === "kitchen")) addRoom("Kitchen", true);
        if (!rooms.some((room) => typeClass(room.type) === "living")) addRoom("Living room", true);
      }
      commit("Suggestion applied to your plan.");
    }
    function addRoom(name, silent) {
      const type = typeClass(name);
      const size = type === "bathroom" ? [4, 4] : type === "balcony" ? [5, 3] : type === "parking" ? [5, 5] : [6, 5];
      const spot = findSpot(size[0], size[1]);
      const index = rooms.filter((room) => typeClass(room.type) === type).length + 1;
      const room = { id: `${type}-${Date.now()}-${index}`, name, type, x: spot.x, y: spot.y, w: size[0], h: size[1], door: true };
      rooms.push(room);
      selectedId = room.id;
      if (!silent) commit(`${name} added to your plan.`);
    }
    function findSpot(w, h) {
      for (let y = 0; y <= plotHeight - h; y++) for (let x = 0; x <= plotWidth - w; x++) {
        const free = rooms.every((room) => x + w <= room.x || x >= room.x + room.w || y + h <= room.y || y >= room.y + room.h);
        if (free) return { x, y };
      }
      return { x: 0, y: Math.min(plotHeight - h, rooms.reduce((max, room) => Math.max(max, room.y + room.h), 0)) };
    }
    function deleteSelected() {
      if (!selectedId) return;
      rooms = rooms.filter((room) => room.id !== selectedId);
      selectedId = rooms[0]?.id || null;
      commit("Room removed.");
    }

    document.querySelectorAll("[data-add-room]").forEach((button) => button.addEventListener("click", () => addRoom(button.dataset.addRoom)));
    document.querySelectorAll("[data-delete-room]").forEach((button) => button.addEventListener("click", deleteSelected));
    document.querySelector(".sidebar-collapse").addEventListener("click", (event) => {
      const sidebar = document.querySelector(".palette-sidebar");
      const collapsed = sidebar.classList.toggle("palette-collapsed");
      event.currentTarget.textContent = collapsed ? "›" : "‹";
      event.currentTarget.setAttribute("aria-label", collapsed ? "Expand palette" : "Collapse palette");
      sidebar.querySelector(".sidebar-subtitle").hidden = collapsed;
      sidebar.querySelector(".palette-list").hidden = collapsed;
      sidebar.querySelector(".palette-help").hidden = collapsed;
    });
    document.querySelectorAll("[data-property]").forEach((input) => {
      input.addEventListener("change", () => {
        const room = rooms.find((item) => item.id === selectedId);
        if (!room) return;
        if (input.dataset.property === "name") {
          const value = input.value.trim();
          if (!value) { input.value = room.name; return; }
          room.name = value;
        } else {
          const number = Number(input.value);
          if (!Number.isFinite(number) || number < 4 || number > 40) {
            toast("Room dimensions should be between 4 and 40 feet.");
            input.value = input.dataset.property === "width" ? room.w * 2 : room.h * 2;
            return;
          }
          if (input.dataset.property === "width") room.w = Math.max(2, Math.round(number / 2));
          if (input.dataset.property === "height") room.h = Math.max(2, Math.round(number / 2));
          room.x = clamp(room.x, 0, plotWidth - room.w);
          room.y = clamp(room.y, 0, plotHeight - room.h);
        }
        commit();
      });
    });
    document.querySelector("[data-room-door]").addEventListener("click", () => {
      const room = rooms.find((item) => item.id === selectedId);
      if (!room) return;
      room.door = !room.door;
      commit(room.door ? "Door added." : "Door removed.");
    });
    document.querySelector("[data-undo]").addEventListener("click", () => {
      if (historyIndex <= 0) return;
      historyIndex--;
      rooms = JSON.parse(history[historyIndex]);
      selectedId = rooms[0]?.id || null;
      persist(); render();
    });
    document.querySelector("[data-redo]").addEventListener("click", () => {
      if (historyIndex >= history.length - 1) return;
      historyIndex++;
      rooms = JSON.parse(history[historyIndex]);
      selectedId = rooms[0]?.id || null;
      persist(); render();
    });
    document.querySelector("[data-validate]").addEventListener("click", () => {
      document.querySelector('[data-tab="validation"]').click();
      toast("Your design checks are up to date.");
    });
    document.querySelectorAll("[data-tab]").forEach((tab) => tab.addEventListener("click", () => {
      const validation = tab.dataset.tab === "validation";
      document.querySelectorAll("[data-tab]").forEach((item) => item.classList.toggle("active", item === tab));
      document.querySelector('[data-inspector="properties"]').hidden = validation;
      document.querySelector('[data-inspector="validation"]').hidden = !validation;
    }));
    document.querySelector("[data-open-validation]").addEventListener("click", () => document.querySelector('[data-tab="validation"]').click());
    document.querySelector("[data-doors]").addEventListener("click", (event) => {
      doorMode = !doorMode;
      event.currentTarget.classList.toggle("door-mode-active", doorMode);
      event.currentTarget.textContent = doorMode ? "⌑ Door mode on" : "⌑ Doors";
      toast(doorMode ? "Choose a room to add or remove a door." : "Door mode off.");
    });
    document.querySelector("[data-toggle-grid]").addEventListener("click", () => {
      gridVisible = !gridVisible;
      canvas.classList.toggle("no-grid", !gridVisible);
    });
    document.querySelector("[data-zoom-in]").addEventListener("click", () => changeZoom(10));
    document.querySelector("[data-zoom-out]").addEventListener("click", () => changeZoom(-10));
    function changeZoom(delta) {
      zoom = clamp(zoom + delta, 70, 130);
      canvas.style.setProperty("--cell", `${22 * zoom / 100}px`);
      document.querySelector("[data-zoom-label]").textContent = `${zoom}%`;
    }
    document.querySelector("[data-save]").addEventListener("click", () => { persist(); toast("Your floor plan is saved in this browser."); });
    const renameDialog = document.querySelector("[data-rename-dialog]");
    const renameForm = document.querySelector("[data-rename-form]");
    document.querySelector("[data-edit-title]").addEventListener("click", () => {
      renameForm.elements.projectName.value = titleEl.textContent;
      renameDialog.showModal();
      renameForm.elements.projectName.focus();
      renameForm.elements.projectName.select();
    });
    renameForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const submitter = event.submitter;
      const title = renameForm.elements.projectName.value.trim();
      renameDialog.close();
      if (submitter?.value === "save" && title) {
        titleEl.textContent = title;
        persist();
      }
    });
    document.addEventListener("keydown", (event) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((event.key === "Delete" || event.key === "Backspace") && selectedId) deleteSelected();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        document.querySelector(event.shiftKey ? "[data-redo]" : "[data-undo]").click();
      }
    });
    if (!history.length) saveHistory();
    render();
  }
})();
