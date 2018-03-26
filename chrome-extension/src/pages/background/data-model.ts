let topLevel = {
  currentTaskId: "integer",   // active task id
  allTasks: [{}, {}, {}]  // array of Task
};

let task = {
  id: "string",   // task id, could be same as timestamp,
  timestamp: "string",  // task time stamp
  name: "string",   // task name, default to first search query if not changed
  search_queries: ["string", "string"],   // array of all search queries
  search_tab_ids: ["string", "string"],   // ids of the tabs that contains the searches
  from_search_tab_id: "string",   // tab id of the last active search
  options: [{}, {}, {}],  // list of all options
  current_option_id: "integer",   // pointer to the current option, default to the first one
  dimentions: [{}, {}, {}],   // list of all dimensions
  piece: [{}, {}, {}],   // list of all pieces collected
};

let option = {
  name: "string",   // name of the option
  link: "string",   // link to this option, default to the first url when collecting
}

let dimension = {
  name: "string",   // name of the dimension
  count: "integer",   // count of occurances, for ranking purposes
}

let piece = {
  id: "string",   // piece id
  timestamp: "string",  // timestamp when the piece was collected
  type: "string",   // type of the piece, default to "text" for now
  content: "string",  // content of the piece
  selected_text: "string",   // selected text of the piece, same as content if type = text
  html_element: "string",   // null for now
  option_list: ["integer", "integer", "integer"],   // option ids of the piece
  dimension_list: ["integer", "integer", "integer"],  // dimension ids of the piece
}