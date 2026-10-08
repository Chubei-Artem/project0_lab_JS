// for css-class
const classNames = {
  TODO_ITEM: "todo-container",
  TODO_CHECKBOX: "todo-checkbox",
  TODO_TEXT: "todo-text",
  TODO_DELETE: "todo-delete",
};
// for jQuery selectors
const list = $("#todo-list");
const itemCountSpan = $("#item-count");
const uncheckedCountSpan = $("#unchecked-count");
// counter for unique IDs of todo items
let todoCounter = 0;

// create input group for new todo item (hidden by default)
const inputGroup = $(`
  <div id="todo-input-group" style="display: none; margin: 15px 0; flex-direction: column; gap: 10px; align-items: center;">
    <div style="display: flex; gap: 8px; width: 100%; justify-content: center;">
      <input type="text" id="custom-todo-input" placeholder="Введіть нове завдання..." style="padding: 8px 12px; border-radius: 6px; border: 1px solid #4a4d55; width: 68%;">
      <button type="button" id="confirm-add-btn" class="button center" style="margin: 0; padding: 8px 14px;">Додати (Enter)</button>
    </div>
    <button type="button" id="load-api-btn" class="button center" style="margin: 0; padding: 6px 14px; font-size: 0.82rem; background-color: #3b3e45; color: #e2e4e9;">
      ⚡ Завантажити випадкове через AJAX
    </button>
  </div>
`);

// insert inputGroup b4 the list
list.before(inputGroup);
inputGroup.hide(); // hide for animka

/*
  func updateCounts
  update the counts of total, checked && unchecked todo items
 */
function updateCounts() {
  const total = list.children("li").length;
  const checked = list.find(`.${classNames.TODO_CHECKBOX}:checked`).length;
  const unchecked = total - checked;
  // update the counts
  itemCountSpan.text(total);
  uncheckedCountSpan.text(unchecked);
}

// func newTodo open/close input field for new todo
function newTodo() {
  const inputContainer = $("#todo-input-group");
  const inputField = $("#custom-todo-input");
  // toggle the visibility of the input container with slide animation
  if (inputContainer.is(":visible")) {
    inputContainer.slideUp(250);
  } else { // if hidden, show it with slideDown animation && focus the input field
    inputContainer.slideDown(250, function () {
      inputField.trigger("focus");
    });
  }
}

// func handleAddTodo create && append new todo item to the list
function handleAddTodo() {
  const inputField = $("#custom-todo-input");
  const text = inputField.val().trim(); // get the input value && trim whitespace
  // validate input
  if (text === "") {
    // highlight input field with red border for 1 second
    inputField[0].style.setProperty("border-color", "#dc3545", "important");
    setTimeout(() => {
      inputField[0].style.removeProperty("border-color");
    }, 1000);
    return;
  }
  // increment todoCounter for unique ID
  todoCounter++;
  const currentId = todoCounter;

  // checkbox for the new todo item
  const checkbox = $("<input>")
    .attr("type", "checkbox")               // set type to checkbox
    .addClass(classNames.TODO_CHECKBOX)     // add class for styling
    .on("change", function () {
      const textSpan = $(this).siblings(`.${classNames.TODO_TEXT}`); // get the sibling span with the todo text
      if (this.checked) { // if checked, apply line-through && reduce opacity
        textSpan.css({
          textDecoration: "line-through",
          opacity: "0.5",
        });
      } else { // if unchecked, remove line-through && restore opacity
        textSpan.css({
          textDecoration: "none",
          opacity: "1",
        });
      }
      updateCounts(); // update counts of checked/unchecked items
    });

  // span for the todo text
  const spanText = $("<span>").addClass(classNames.TODO_TEXT).text(text);

  // del button for the todo item (bind deleteToDo function with currentId)
  const delButton = $("<button>")
    .addClass(classNames.TODO_DELETE)
    .text("Видалити")
    .on("click", deleteToDo.bind(this, currentId));

  // create li element with checkbox, text && del button
  const li = $("<li>")
    .attr("id", "todo-" + currentId)
    .addClass(classNames.TODO_ITEM)
    .append(checkbox)
    .append(spanText)
    .append(delButton)
    .hide(); // hide for animation

  // append li to the list with slideDown + fadeIn animation
  list.append(li);
  li.slideDown(350).animate({ opacity: 1 }, { queue: false, duration: 350 });

  // clear input field && update counts
  inputField.val("");
  updateCounts();
}

// func deleteToDo remove todo item with fadeOut + slideUp animation
function deleteToDo(id) {
  const item = $("#todo-" + id);    // get the li element by id

  // animate fadeOut + slideUp, then remove the item + update counts
  item.fadeOut(500, function () {
    item.slideUp(200, function () {
      $(this).remove();             // remove the li element from DOM
      updateCounts();
    });
  });
}

// func loadTodoFromApi fetch a random todo item from the API && add it to the list
function loadTodoFromApi() {
  // generate a random ID between 1 and 100 for the API request
  const randomId = Math.floor(Math.random() * 100) + 1;
  const loadBtn = $("#load-api-btn");
  // disable the button && show loading text while the AJAX request is in progress
  loadBtn.text("Завантаження...").prop("disabled", true);
  // make an AJAX GET request to the API endpoint for the random todo item
  $.ajax({
    url: `https://jsonplaceholder.typicode.com/todos/${randomId}`,
    method: "GET",
    dataType: "json", // expect JSON response
    success: function (data) {
      // set the input field value to the title from the API response
      $("#custom-todo-input").val(data.title);
      handleAddTodo(); // call handleAddTodo to add the new todo item to the list

      // if the todo item from the API is marked as completed, check the checkbox for the last added todo item
      if (data.completed) {
        const lastTodo = list.children("li").last();
        lastTodo.find(`.${classNames.TODO_CHECKBOX}`).prop("checked", true).trigger("change");
      }
    },
    error: function (xhr, status, error) {
      // log the error to the console && show an alert to the user
      console.error("Помилка AJAX-запиту:", error);
      alert("Не вдалося завантажити завдання з сервера");
    },
    complete: function () {
      // re-enable the button && restore its original text after the AJAX request is complete
      loadBtn.text("⚡ Завантажити випадкове через AJAX").prop("disabled", false);
    },
  });
}

// document ready, bind events to buttons && input field
$(document).ready(function () {
  // bind click event to the "Додати нове завдання" button
  $("#confirm-add-btn").on("click", handleAddTodo);
  // bind keypress event to the input field for "Enter" key
  $("#custom-todo-input").on("keypress", function (e) {
    if (e.which === 13) {
      // 13 = Enter key
      handleAddTodo(); // call handleAddTodo
    }
  });
  // bind click event to the "Завантажити завдання через AJAX" button
  $("#load-api-btn").on("click", loadTodoFromApi);
});