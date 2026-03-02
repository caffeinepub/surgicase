import Array "mo:core/Array";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Iter "mo:core/Iter";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Access control setup
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public type Species = {
    #canine;
    #feline;
    #other;
  };

  public type Sex = {
    #male;
    #maleNeutered;
    #female;
    #femaleSpayed;
  };

  public type Task = {
    dischargeNotes : Bool;
    pDVMNotified : Bool;
    labs : Bool;
    histo : Bool;
    surgeryReport : Bool;
    imaging : Bool;
    culture : Bool;
    dailySummary : Bool;
  };

  public type Appointment = {
    appointmentId : Nat;
    caseId : ?Nat;
    patientName : Text;
    ownerName : Text;
    species : Species;
    sex : Sex;
    breed : Text;
    mrn : Text;
    arrivalDate : Text;
    reason : Text;
    tasks : Task;
    dateOfBirth : Text;
  };

  module Appointment {
    public func compare(a1 : Appointment, a2 : Appointment) : Order.Order {
      Nat.compare(a1.appointmentId, a2.appointmentId);
    };
  };

  public type Case = {
    caseId : Nat;
    mrn : Text;
    arrivalDate : Text;
    petName : Text;
    ownerLastName : Text;
    species : Species;
    breed : Text;
    sex : Sex;
    dateOfBirth : Text;
    presentingComplaint : Text;
    notes : Text;
    tasks : Task;
    appointments : [Nat];
  };

  module Case {
    public func compare(case1 : Case, case2 : Case) : Order.Order {
      Nat.compare(case1.caseId, case2.caseId);
    };
  };

  var nextCaseId = 1;
  var nextAppointmentId = 1;
  let cases = Map.empty<Nat, Case>();
  let appointments = Map.empty<Nat, Appointment>();

  public shared ({ caller }) func createCase(
    mrn : Text,
    arrivalDate : Text,
    petName : Text,
    ownerLastName : Text,
    species : Species,
    breed : Text,
    sex : Sex,
    dateOfBirth : Text,
    presentingComplaint : Text,
    notes : Text,
    tasks : Task,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create cases");
    };

    let caseId = nextCaseId;
    nextCaseId += 1;

    let newCase : Case = {
      caseId;
      mrn;
      arrivalDate;
      petName;
      ownerLastName;
      species;
      breed;
      sex;
      dateOfBirth;
      presentingComplaint;
      notes;
      tasks;
      appointments = [];
    };

    cases.add(caseId, newCase);
    caseId;
  };

  public shared ({ caller }) func updateCase(
    caseId : Nat,
    mrn : Text,
    arrivalDate : Text,
    petName : Text,
    ownerLastName : Text,
    species : Species,
    breed : Text,
    sex : Sex,
    dateOfBirth : Text,
    presentingComplaint : Text,
    notes : Text,
    tasks : Task,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cases");
    };

    switch (cases.get(caseId)) {
      case (null) { Runtime.trap("Case not found") };
      case (?existingCase) {
        let updatedCase : Case = {
          caseId;
          mrn;
          arrivalDate;
          petName;
          ownerLastName;
          species;
          breed;
          sex;
          dateOfBirth;
          presentingComplaint;
          notes;
          tasks;
          appointments = existingCase.appointments;
        };
        cases.add(caseId, updatedCase);
      };
    };
  };

  public shared ({ caller }) func deleteCase(caseId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete cases");
    };

    switch (cases.get(caseId)) {
      case (null) { Runtime.trap("Case not found") };
      case (?c) {
        cases.remove(caseId);

        // Remove associated appointments
        let appointmentsToRemove = c.appointments;
        appointmentsToRemove.forEach(
          func(appointmentId) {
            appointments.remove(appointmentId);
          }
        );
      };
    };
  };

  public query ({ caller }) func getCases() : async [Case] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };

    cases.values().toArray().sort();
  };

  public query ({ caller }) func getCaseById(caseId : Nat) : async Case {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };

    switch (cases.get(caseId)) {
      case (null) { Runtime.trap("Case not found") };
      case (?c) { c };
    };
  };

  public query ({ caller }) func getCaseByMRN(mrn : Text) : async Case {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cases");
    };

    switch (cases.values().find(func(c : Case) : Bool { c.mrn == mrn })) {
      case (null) { Runtime.trap("Case not found") };
      case (?c) { c };
    };
  };

  public shared ({ caller }) func toggleTaskComplete(caseId : Nat, taskName : Text, isCompleted : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update tasks");
    };

    switch (cases.get(caseId)) {
      case (null) { Runtime.trap("Case not found") };
      case (?caseData) {
        let tasks = caseData.tasks;

        let updatedTasks : Task = switch (taskName) {
          case ("dischargeNotes") {
            {
              tasks with
              dischargeNotes = isCompleted;
            };
          };
          case ("pDVMNotified") {
            {
              tasks with
              pDVMNotified = isCompleted;
            };
          };
          case ("labs") {
            {
              tasks with
              labs = isCompleted;
            };
          };
          case ("histo") {
            {
              tasks with
              histo = isCompleted;
            };
          };
          case ("surgeryReport") {
            {
              tasks with
              surgeryReport = isCompleted;
            };
          };
          case ("imaging") {
            {
              tasks with
              imaging = isCompleted;
            };
          };
          case ("culture") {
            {
              tasks with
              culture = isCompleted;
            };
          };
          case ("dailySummary") {
            {
              tasks with
              dailySummary = isCompleted;
            };
          };
          case (_) { Runtime.trap("Task not found") };
        };

        cases.add(
          caseId,
          {
            caseData with
            tasks = updatedTasks;
          },
        );
      };
    };
  };

  public query ({ caller }) func getTasksForCase(caseId : Nat) : async Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    switch (cases.get(caseId)) {
      case (null) { Runtime.trap("Case not found") };
      case (?caseData) { caseData.tasks };
    };
  };

  // Appointment functions
  public shared ({ caller }) func createAppointment(
    patientName : Text,
    ownerName : Text,
    species : Species,
    sex : Sex,
    breed : Text,
    mrn : Text,
    arrivalDate : Text,
    reason : Text,
    dateOfBirth : Text,
    tasks : Task,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create appointments");
    };

    let appointmentId = nextAppointmentId;
    nextAppointmentId += 1;

    // Check if there is an existing case for this MRN
    let caseId = switch (cases.values().find(func(c) { c.mrn == mrn })) {
      case (null) { null }; // No existing case, set caseId to null
      case (?existingCase) { ?existingCase.caseId };
    };

    let newAppointment : Appointment = {
      appointmentId;
      caseId;
      patientName;
      ownerName;
      species;
      sex;
      breed;
      mrn;
      arrivalDate;
      reason;
      dateOfBirth;
      tasks;
    };

    appointments.add(appointmentId, newAppointment);

    // If a case exists, update its appointment list
    switch (caseId) {
      case (null) { () };
      case (?existingCaseId) {
        switch (cases.get(existingCaseId)) {
          case (null) { () };
          case (?currentCase) {
            let updatedCase = {
              currentCase with
              appointments = currentCase.appointments.concat([appointmentId]);
            };
            cases.add(existingCaseId, updatedCase);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateAppointment(
    appointmentId : Nat,
    patientName : Text,
    ownerName : Text,
    species : Species,
    sex : Sex,
    breed : Text,
    mrn : Text,
    arrivalDate : Text,
    reason : Text,
    dateOfBirth : Text,
    tasks : Task,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update appointments");
    };

    switch (appointments.get(appointmentId)) {
      case (null) { Runtime.trap("Appointment not found") };
      case (?existingAppointment) {
        let updatedAppointment : Appointment = {
          appointmentId;
          caseId = existingAppointment.caseId;
          patientName;
          ownerName;
          species;
          sex;
          breed;
          mrn;
          arrivalDate;
          reason;
          dateOfBirth;
          tasks;
        };
        appointments.add(appointmentId, updatedAppointment);
      };
    };
  };

  public shared ({ caller }) func deleteAppointment(appointmentId : Nat) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete appointments");
    };

    if (appointments.containsKey(appointmentId)) {
      appointments.remove(appointmentId);
      true;
    } else {
      false;
    };
  };

  public query ({ caller }) func getAppointments() : async [Appointment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view appointments");
    };

    appointments.values().toArray().sort();
  };

  public query ({ caller }) func getAppointmentById(appointmentId : Nat) : async Appointment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view appointments");
    };

    switch (appointments.get(appointmentId)) {
      case (null) { Runtime.trap("Appointment not found") };
      case (?a) { a };
    };
  };

  public query ({ caller }) func getAppointmentsByMRN(mrn : Text) : async [Appointment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view appointments");
    };

    let filteredAppointments = appointments.values().filter(
      func(a) { a.mrn == mrn }
    );
    filteredAppointments.toArray();
  };

  public query ({ caller }) func getAppointmentsByPatientName(patientName : Text) : async [Appointment] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view appointments");
    };

    let filteredAppointments = appointments.values().filter(
      func(a) { a.patientName == patientName }
    );
    filteredAppointments.toArray();
  };

  public shared ({ caller }) func toggleAppointmentTaskComplete(appointmentId : Nat, taskName : Text, isCompleted : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update appointment tasks");
    };

    switch (appointments.get(appointmentId)) {
      case (null) { Runtime.trap("Appointment not found") };
      case (?appointmentData) {
        let tasks = appointmentData.tasks;

        let updatedTasks : Task = switch (taskName) {
          case ("dischargeNotes") {
            {
              tasks with
              dischargeNotes = isCompleted;
            };
          };
          case ("pDVMNotified") {
            {
              tasks with
              pDVMNotified = isCompleted;
            };
          };
          case ("labs") {
            {
              tasks with
              labs = isCompleted;
            };
          };
          case ("histo") {
            {
              tasks with
              histo = isCompleted;
            };
          };
          case ("surgeryReport") {
            {
              tasks with
              surgeryReport = isCompleted;
            };
          };
          case ("imaging") {
            {
              tasks with
              imaging = isCompleted;
            };
          };
          case ("culture") {
            {
              tasks with
              culture = isCompleted;
            };
          };
          case ("dailySummary") {
            {
              tasks with
              dailySummary = isCompleted;
            };
          };
          case (_) { Runtime.trap("Task not found") };
        };

        appointments.add(
          appointmentId,
          {
            appointmentData with
            tasks = updatedTasks;
          },
        );
      };
    };
  };

  public query ({ caller }) func getTasksForAppointment(appointmentId : Nat) : async Task {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view appointment tasks");
    };

    switch (appointments.get(appointmentId)) {
      case (null) { Runtime.trap("Appointment not found") };
      case (?appointmentData) { appointmentData.tasks };
    };
  };
};
