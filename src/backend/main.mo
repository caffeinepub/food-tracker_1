import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Map "mo:core/Map";
import List "mo:core/List";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Float "mo:core/Float";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Data Types
  type WasteEntry = {
    id : Nat;
    foodName : Text;
    quantity : Float;
    reason : Text;
    mealType : Text;
    date : Text;
    notes : Text;
    owner : Principal;
    timestamp : Time.Time;
  };

  type Tip = {
    id : Nat;
    text : Text;
  };

  type Stats = {
    totalWaste : Float;
    totalWasteThisWeek : Float;
    totalWasteThisMonth : Float;
    mostWastedFood : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  type FoodDonation = {
    id : Nat;
    foodName : Text;
    quantity : Float;
    unit : Text;
    location : Text;
    pickupWindow : Text;
    contact : Text;
    status : Text; // available, claimed, collected
    donor : Principal;
    claimedBy : ?Principal;
    timestamp : Time.Time;
  };

  module WasteEntry {
    public func compare(w1 : WasteEntry, w2 : WasteEntry) : Order.Order {
      Nat.compare(w1.id, w2.id);
    };
  };

  module Tip {
    public func compare(tip1 : Tip, tip2 : Tip) : Order.Order {
      Nat.compare(tip1.id, tip2.id);
    };
  };

  module FoodDonation {
    public func compare(d1 : FoodDonation, d2 : FoodDonation) : Order.Order {
      Nat.compare(d1.id, d2.id);
    };
  };

  // Storage
  var nextWasteId = 0;
  var nextTipId = 0;
  var nextDonationId = 0;
  let wasteEntries = Map.empty<Nat, WasteEntry>();
  let tips = List.empty<Tip>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let foodDonations = Map.empty<Nat, FoodDonation>();

  // Helper functions
  func isWasteEntryOwner(entry : WasteEntry, caller : Principal) : Bool {
    entry.owner == caller;
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
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

  // Waste Entry Management
  public shared ({ caller }) func addWasteEntry(foodName : Text, quantity : Float, reason : Text, mealType : Text, date : Text, notes : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add waste entries");
    };
    let id = nextWasteId;
    let entry : WasteEntry = {
      id;
      foodName;
      quantity;
      reason;
      mealType;
      date;
      notes;
      owner = caller;
      timestamp = Time.now();
    };
    wasteEntries.add(id, entry);
    nextWasteId += 1;
    id;
  };

  public query ({ caller }) func getMyWasteEntries() : async [WasteEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view waste entries");
    };
    wasteEntries.values().toArray().filter(
      func(entry) { isWasteEntryOwner(entry, caller) }
    ).sort();
  };

  public shared ({ caller }) func deleteWasteEntry(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete waste entries");
    };
    switch (wasteEntries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?entry) {
        if (not isWasteEntryOwner(entry, caller)) {
          Runtime.trap("Unauthorized to delete this entry");
        };
        wasteEntries.remove(id);
      };
    };
  };

  // Tips Management
  public shared ({ caller }) func addTip(text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add tips");
    };
    let id = nextTipId;
    let tip : Tip = {
      id;
      text;
    };
    tips.add(tip);
    nextTipId += 1;
  };

  public query func getTips() : async [Tip] {
    tips.toArray().sort();
  };

  // Statistics
  public query ({ caller }) func getStats() : async Stats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view statistics");
    };
    var totalWaste = 0.0;
    let myEntries = wasteEntries.values().toArray().filter(
      func(entry) { isWasteEntryOwner(entry, caller) }
    );

    for (entry in myEntries.values()) {
      totalWaste += entry.quantity;
    };

    let mostWastedFood = switch (myEntries.values().next()) {
      case (?entry) { entry.foodName };
      case (null) { "" };
    };

    {
      totalWaste;
      totalWasteThisWeek = totalWaste;
      totalWasteThisMonth = totalWaste;
      mostWastedFood;
    };
  };

  // Food Donation Management
  public shared ({ caller }) func addFoodDonation(foodName : Text, quantity : Float, unit : Text, location : Text, pickupWindow : Text, contact : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can donate food");
    };
    let id = nextDonationId;
    let donation : FoodDonation = {
      id;
      foodName;
      quantity;
      unit;
      location;
      pickupWindow;
      contact;
      status = "available";
      donor = caller;
      claimedBy = null;
      timestamp = Time.now();
    };
    foodDonations.add(id, donation);
    nextDonationId += 1;
    id;
  };

  public query func getAvailableDonations() : async [FoodDonation] {
    foodDonations.values().toArray().filter(
      func(d) { d.status == "available" }
    ).sort();
  };

  public query func getAllDonations() : async [FoodDonation] {
    foodDonations.values().toArray().sort();
  };

  public query ({ caller }) func getMyDonations() : async [FoodDonation] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    foodDonations.values().toArray().filter(
      func(d) { d.donor == caller }
    ).sort();
  };

  public shared ({ caller }) func claimDonation(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can claim donations");
    };
    switch (foodDonations.get(id)) {
      case (null) { Runtime.trap("Donation not found") };
      case (?donation) {
        if (donation.status != "available") {
          Runtime.trap("Donation is not available");
        };
        if (donation.donor == caller) {
          Runtime.trap("Cannot claim your own donation");
        };
        let updated : FoodDonation = {
          donation with
          status = "claimed";
          claimedBy = ?caller;
        };
        foodDonations.add(id, updated);
      };
    };
  };

  public shared ({ caller }) func markCollected(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (foodDonations.get(id)) {
      case (null) { Runtime.trap("Donation not found") };
      case (?donation) {
        if (donation.status != "claimed") {
          Runtime.trap("Donation must be claimed first");
        };
        let isClaimer = switch (donation.claimedBy) {
          case (?p) { p == caller };
          case (null) { false };
        };
        if (not isClaimer and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Only the claimer can mark as collected");
        };
        let updated : FoodDonation = {
          donation with
          status = "collected";
        };
        foodDonations.add(id, updated);
      };
    };
  };
};
