import templateManager from '../comms/templates/TemplateManager';

var alt = require('../alt');

class TemplateActions {

  updateTemplates(list) {
    return list;
  }

  insertTemplate(template) {
    return template;
  }

  addTemplate(template) {
    const newTemplate = template;
    return (dispatch) => {
      templateManager.addDevice(newTemplate)
        .then((response) => {
          this.insertTemplate(newTemplate);
        })
        .catch((error) => {
          this.templatesFailed("Failed to add template to list");
        })

      dispatch();
    }
  }

  fetchTemplates() {
    return (dispatch) => {
      templateManager.getDevices()
        .then((templateList) => {
          console.log("templates webservice done");
          this.updateTemplates(templateList.templates);
        })
        .catch((error) => {
          this.templatesFailed(error);
        });

      dispatch();
    }
  }

  triggerUpdate(template) {
    return (dispatch) => {
      templateManager.setDevice(template)
        .then((response) => {
          this.updateSingle(template);
        })
        .catch((error) => {
          console.log("Error!", error);
          this.templatesFailed("Failed to update given template");
        })

      dispatch();
    }
  }

  triggerIconUpdate(id, icon) {
    return (dispatch) => {
      templateManager.setIcon(id, icon)
        .then((response) => {
          console.log("done");
          this.setIcon(id);
        })
        .catch(function(error) {
          console.log("Failed to update icon", error);
        })

      dispatch();
    }
  }

  setIcon(id) {
    return id;
  }

  triggerRemoval(template) {
    return (dispatch) => {
      templateManager.deleteDevice(template.id)
        .then((response) => {
          this.removeSingle(template.id);
        })
        .catch((error) => {
          console.log("Error!", error);
          this.templatesFailed("Failed to remove given template");
        })

      dispatch();
    }
  }

  updateSingle(template) {
    return template;
  }

  removeSingle(template) {
    return template;
  }

  templatesFailed(error) {
    return error;
  }
}

alt.createActions(TemplateActions, exports);