Template.grade_table.created = function(){
  Session.set('current_week', 1)
}

Template.grade_table.rendered = function(){
  this.picker = this.$('#scheduleWeekSelect').pickadate({
     selectMonths: true,
     selectYears: true,
     firstDay: 1,
     format: 'mm-dd-yyyy',
     container: '#scheduleWeekSelectContainer'
  }).pickadate('picker')
  
  var termId = Session.get('current_term')
  this.picker.on('set', function(obj){
    var term = SchoolTerm.findOne({_id: termId})
    var start = moment.utc(term.mondayDate)
    var selectedMonday = moment.utc(obj.select).startOf('isoWeek')
    var week = selectedMonday.diff(start, 'weeks') + 1
    if(week > 52)
      week = 52
    if(week < 1)
      week = 1
    Session.set('current_week', week)
  })
  this.picker.set('select', new Date())
}

function gradeRenderer(instance, td, row, col, prop, gradeValue, cellProperties) {
  var escaped =  ""
  if(gradeValue && gradeValue.value){
    escaped = Handsontable.helper.stringify(gradeValue.value);
  }
  td.innerHTML = escaped;
  return td;
}

var gradeEditor = Handsontable.editors.TextEditor.prototype.extend()
gradeEditor.prototype.setValue = function(value){
  var text = ""
  // Get what they originally typed in not the calculated value
  if(this.originalValue && this.originalValue.text){
    text = this.originalValue.text
  }
  Handsontable.editors.TextEditor.prototype.setValue.apply(this, [text])
}
gradeEditor.prototype.getValue = function(){
  var textValue = Handsontable.editors.TextEditor.prototype.getValue.apply(this, [])
  return Course.calculateGradeData(textValue)
}

Template.grade_table.helpers({
  data: function(){
    var templateInstance = Template.instance()
    
    return function(){
      var week = Session.get('current_week')
      var termId = Session.get('current_term')
      return Course.getSchedule(termId, week)
    }
  },
  
  options: function(){
    return {
      fixedColumnsLeft: 1,
      colWidths: [200, 60, 200, 60, 200, 60, 200, 60, 200, 60, 200, 60, 200, 60, 200],
      colHeaders: ['<input id="selectWeek" readonly/>', '', 'Monday', '', 'Tuesday', '', 'Wednesday', '', 'Thursday', '', 'Friday', '', 'Saturday', '', 'Sunday'],
      columns: [ {data: 'title'}, 
                {data: 'g1', renderer: gradeRenderer, editor: gradeEditor}, {data: 'd1'}, 
                {data: 'g2', renderer: gradeRenderer, editor: gradeEditor}, {data: 'd2'}, 
                {data: 'g3', renderer: gradeRenderer, editor: gradeEditor}, {data: 'd3'}, 
                {data: 'g4', renderer: gradeRenderer, editor: gradeEditor}, {data: 'd4'}, 
                {data: 'g5', renderer: gradeRenderer, editor: gradeEditor}, {data: 'd5'}, 
                {data: 'g6', renderer: gradeRenderer, editor: gradeEditor}, {data: 'd6'}, 
                {data: 'g7', renderer: gradeRenderer, editor: gradeEditor}, {data: 'd7'} ],
      
      afterChange: updateData,
      afterRender: updateWeekDisplay
    }
  }
})

Template.grade_table.events({
  'click #selectWeek': function (e){
    Template.instance().picker.open()
    e.stopPropagation()
    e.preventDefault()
  }
})

function updateWeekDisplay(){
    var termId = Session.get('current_term')
    var term = SchoolTerm.findOne({_id: termId})
    var start = moment.utc(term.mondayDate)
    var week = Session.get('current_week') - 1
    start.add(week, 'weeks')
    var display = start.format('MM/DD') + ' - '
    start.add(6, 'days')
    display = display + start.format('MM/DD')
    $('#gradebook-container th input').val(display)
}

function updateData(change, source){
  // Don't run when loading
  if (source !== "loadData") {
    for (i = 0; i < change.length; i++) {
      //var oldVal = change[i][2]
      var newVal = change[i][3]
      var rowNum = change[i][0]
      var data = this.getSourceDataAtRow(rowNum)
      var week = data.weekNumber
      var courseId = data.courseId
      if(key === 'title'){
        // Update course title
      }else{
        var key = change[i][1]
        var dg = key.charAt(0)
        var day = key.charAt(1)
        if(dg === 'd'){
          // Update course day description
          Course.setDescription(courseId, week, day, newVal)
        }else{
          var studentId = data.studentId
          // Update course day student grade
          Course.setGrade(courseId, studentId, week, day, newVal.text)
        }
        
      }
    }               
  }
}
