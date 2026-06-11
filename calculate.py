# Calculations for Milling Process - Interactive CLI and Default Slices

def get_float_input(prompt, default=None):
    while True:
        val = input(prompt).strip()
        if not val and default is not None:
            return default
        try:
            return float(val)
        except ValueError:
            print("Invalid number. Please try again.")

def get_choice_input(prompt, choices, default=None):
    while True:
        val = input(prompt).strip().lower()
        if not val and default is not None:
            return default
        if val in choices:
            return val
        print(f"Invalid choice. Please choose from: {', '.join(choices)}")

def run_interactive():
    print("=== Rice Milling Cost & Yield Interactive Calculator ===")
    bag_weight = get_float_input("Standard Bag Weight (kg) [default: 50.0]: ", default=50.0)
    
    # 1. Sourcing Data
    sourcing_items = {}
    print("\n--- 1. Enter Sourcing Data ---")
    while True:
        name = input("Sourcing Item Name (or press Enter to finish): ").strip()
        if not name:
            break
        qty = get_float_input(f"Quantity for {name}: ")
        unit_size = get_float_input(f"Unit Size in KG for {name} [default: {bag_weight}]: ", default=bag_weight)
        rate = get_float_input(f"Rate per Unit (size: {unit_size} kg): ")
        
        sourcing_items[name] = {"qty": qty, "unit_size": unit_size, "rate": rate}
            
    if not sourcing_items:
        print("No sourcing items entered. Exiting.")
        return
        
    # 2. Additional Operational Expenses
    operational_expenses = {}
    print("\n--- 2. Enter Operational Expenses ---")
    while True:
        name = input("Expense Description (or press Enter to finish): ").strip()
        if not name:
            break
        amount = get_float_input(f"Amount for {name}: ")
        operational_expenses[name] = amount
        
    # 3. Production Output
    print("\n--- 3. Enter Main Product Output (Rice) ---")
    main_bags = get_float_input("Main Rice Output (Bags): ")
    main_kg = get_float_input(f"Weight (KG) [default: {main_bags * bag_weight}]: ", default=main_bags * bag_weight)
    main_product = {"name": "Rice", "bags": main_bags, "kg": main_kg}
    
    # 4. By-products
    by_product_rates = {}
    print("\n--- 4. Enter By-Products ---")
    while True:
        name = input("By-product Name (or press Enter to finish): ").strip()
        if not name:
            break
        qty_kg = get_float_input(f"Quantity (KG) for {name}: ")
        unit_size = get_float_input(f"Unit Size in KG for {name} [default: {bag_weight}]: ", default=bag_weight)
        rate = get_float_input(f"Price per Unit (size: {unit_size} kg): ")
        
        by_product_rates[name] = {"kg": qty_kg, "unit_size": unit_size, "rate": rate}
        
    calculate_and_print(bag_weight, sourcing_items, operational_expenses, main_product, by_product_rates)

def calculate_and_print(bag_weight, sourcing_items, operational_expenses, main_product, by_product_rates):
    # Calculate sourcing costs
    total_sourcing_cost = 0
    sourcing_cost_excl_loose = 0
    loose_stock_cost = 0
    total_input_kg_excl_loose = 0
    total_input_kg = 0
    sourcing_breakdown = {}
    for name, info in sourcing_items.items():
        qty = info["qty"]
        unit_size = info["unit_size"]
        rate = info["rate"]
        
        cost = qty * rate
        sourcing_breakdown[name] = cost
        total_sourcing_cost += cost
        total_input_kg += qty * unit_size
        
        if "loose stock" in name.lower():
            loose_stock_cost += cost
        else:
            sourcing_cost_excl_loose += cost
            total_input_kg_excl_loose += qty * unit_size
        
    # Calculate opex
    total_operational_cost = sum(operational_expenses.values())
    
    # Calculate byproduct revenues
    by_product_revenues = {}
    total_byproduct_kg = 0
    for name, info in by_product_rates.items():
        qty_kg = info["kg"]
        unit_size = info["unit_size"]
        rate = info["rate"]
        
        qty_units = qty_kg / unit_size
        revenue = qty_units * rate
        total_byproduct_kg += qty_kg
        
        by_product_revenues[name] = {
            "kg": qty_kg,
            "qty_units": qty_units,
            "unit_size": unit_size,
            "rate": rate,
            "revenue": revenue
        }
    total_by_product_revenue = sum(item["revenue"] for item in by_product_revenues.values())
    
    # Final cost calculations
    final_cost_main_product = total_sourcing_cost + total_operational_cost - total_by_product_revenue
    cost_per_bag = final_cost_main_product / main_product["bags"] if main_product["bags"] > 0 else 0
    cost_per_kg = final_cost_main_product / main_product["kg"] if main_product["kg"] > 0 else 0
    
    total_sourcing_bags_excl_loose = total_input_kg_excl_loose / bag_weight
    average_sourcing_per_bag = (sourcing_cost_excl_loose / total_input_kg_excl_loose) * bag_weight if total_input_kg_excl_loose > 0 else 0
    sorting_cost_per_bag = cost_per_bag - average_sourcing_per_bag

    total_output_kg = main_product["kg"] + total_byproduct_kg
    recovery_pct = (total_output_kg / total_input_kg) * 100 if total_input_kg > 0 else 0
    
    # Output formatting
    print("\n==============================================")
    print("               BALANCE SHEET REPORT           ")
    print("==============================================")
    print("\n=== SOURCING COSTS ===")
    for name, info in sourcing_items.items():
        cost = sourcing_breakdown[name]
        print(f"  {name:<25} ({info['qty']:.1f} x {info['unit_size']:.1f} kg) @ TK {info['rate']:,.2f}: TK {cost:,.2f}")
    print(f"  {'Sourcing (excl. Loose)':<25}: TK {sourcing_cost_excl_loose:,.2f}")
    print(f"  {'Loose Stock Sourcing':<25}: TK {loose_stock_cost:,.2f}")
    print(f"  {'Total Sourcing Cost':<25}: TK {total_sourcing_cost:,.2f}")
    
    print("\n=== OPERATIONAL EXPENSES ===")
    for name, amount in operational_expenses.items():
        print(f"  {name:<25}: TK {amount:,.2f}")
    print(f"  {'Total Operational Cost':<25}: TK {total_operational_cost:,.2f}")
    
    print("\n=== BY-PRODUCT RECOVERY ===")
    for name, info in by_product_revenues.items():
        print(f"  {name:<25} ({info['kg']:.1f} kg = {info['qty_units']:.2f} x {info['unit_size']:.1f} kg) @ TK {info['rate']:,.2f}: -TK {info['revenue']:,.2f}")
    print(f"  {'Total By-product Revenue':<25}: -TK {total_by_product_revenue:,.2f}")
    
    print("\n=== FINAL RESULTS ===")
    print(f"  {'Gross Cost (Sourcing + Opex)':<30}: TK {total_sourcing_cost + total_operational_cost:,.2f}")
    print(f"  {'By-product Offsets':<30}: -TK {total_by_product_revenue:,.2f}")
    print(f"  {'Final Net Cost of Rice':<30}: TK {final_cost_main_product:,.2f}")
    print(f"  {'Main Rice Quantity':<30}: {main_product['bags']:.0f} bags ({main_product['kg']:,} kg)")
    print(f"  {'Total Input Sourcing Qty':<30}: {total_input_kg:,.1f} kg")
    print(f"  {'Total Output Qty':<30}: {total_output_kg:,.1f} kg (Rice: {main_product['kg']:,.1f} kg + By-products: {total_byproduct_kg:,.1f} kg)")
    print(f"  {'Process Recovery Ratio':<30}: {recovery_pct:.2f}%")
    print(f"  {'Final Cost per Bag':<30}: TK {cost_per_bag:,.2f}")
    print(f"  {'Avg Sourcing per Raw Bag':<30}: TK {average_sourcing_per_bag:,.2f}")
    print(f"  {'Sorting Cost per Bag':<30}: TK {sorting_cost_per_bag:,.2f}")
    print(f"  {'Final Cost per KG':<30}: TK {cost_per_kg:,.2f}")
    print("==============================================\n")
    
    # Save History Option
    save_choice = input("Do you want to save this run to history? (y/N): ").strip().lower()
    if save_choice in ['y', 'yes']:
        batch_name = input("Enter a name for this batch run: ").strip()
        if not batch_name:
            batch_name = "Unnamed Batch"
        
        import os
        from datetime import datetime
        
        log_entry = f"=== Batch: {batch_name} (Saved at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}) ===\n"
        log_entry += f"  [Configuration]\n"
        log_entry += f"    Standard Bag Weight     : {bag_weight:.1f} kg\n"
        log_entry += f"  [Sourcing Data]\n"
        for name, info in sourcing_items.items():
            log_entry += f"    - {name:<23} : {info['qty']:.1f} x {info['unit_size']:.1f} kg @ TK {info['rate']:,.2f} (TK {info['qty'] * info['rate']:,.2f})\n"
        log_entry += f"  [Operational Expenses]\n"
        for name, amount in operational_expenses.items():
            log_entry += f"    - {name:<23} : TK {amount:,.2f}\n"
        log_entry += f"  [By-products Recovery]\n"
        for name, info in by_product_rates.items():
            qty_units = info["kg"] / info["unit_size"]
            revenue = qty_units * info["rate"]
            log_entry += f"    - {name:<23} : {info['kg']:.1f} kg ({qty_units:.2f} x {info['unit_size']:.1f} kg) @ TK {info['rate']:,.2f} (-TK {revenue:,.2f})\n"
        log_entry += f"  [Main Product Output]\n"
        log_entry += f"    - Rice                  : {main_product['bags']:.0f} bags ({main_product['kg']:,} kg)\n"
        log_entry += f"  [Process Yield & Costs Summary]\n"
        log_entry += f"    Total Input Sourcing Qty: {total_input_kg:,.1f} kg\n"
        log_entry += f"    Total Output Qty        : {total_output_kg:,.1f} kg\n"
        log_entry += f"    Process Recovery Ratio  : {recovery_pct:.2f}%\n"
        log_entry += f"    Final Rice Net Cost     : TK {final_cost_main_product:,.2f}\n"
        log_entry += f"    Final Cost per Bag      : TK {cost_per_bag:,.2f}\n"
        log_entry += f"    Avg Sourcing per Raw Bag: TK {average_sourcing_per_bag:,.2f}\n"
        log_entry += f"    Sorting Cost per Bag    : TK {sorting_cost_per_bag:,.2f}\n"
        log_entry += f"    Final Cost per KG       : TK {cost_per_kg:,.2f}\n"
        log_entry += "==============================================\n\n"
        
        with open("history_log.txt", "a", encoding="utf-8") as f:
            f.write(log_entry)
            
        print("Run successfully saved to history_log.txt.")

def run_default():
    bag_weight = 50.0
    sourcing_items = {
        "Category 90": {"qty": 230, "unit_size": 50.0, "rate": 5445.0},
        "Tulshi B Batch": {"qty": 20, "unit_size": 50.0, "rate": 6000.0},
        "Tulshi A Batch": {"qty": 183, "unit_size": 52.8, "rate": 6795.0},
        "Loose Stock": {"qty": 138, "unit_size": 1.0, "rate": 100.0}
    }
    
    operational_expenses = {
        "Crushing Bill": 28250,
        "Chala Bill": 9600,
        "Flavour": 7000,
        "Vehicle (Transport)": 4130
    }
    
    main_product = {"name": "Rice", "bags": 417, "kg": 20850}
    
    by_product_rates = {
        "Khud": {"kg": 625.0, "unit_size": 50.0, "rate": 1500.0},
        "Mora": {"kg": 235.0, "unit_size": 50.0, "rate": 1300.0},
        "Mota": {"kg": 246.0, "unit_size": 50.0, "rate": 3000.0},
        "Grader": {"kg": 263.0, "unit_size": 50.0, "rate": 6000.0},
        "Loose Stock": {"kg": 56.0, "unit_size": 50.0, "rate": 5000.0}
    }
    
    calculate_and_print(bag_weight, sourcing_items, operational_expenses, main_product, by_product_rates)

def view_history():
    import os
    if not os.path.exists("history_log.txt"):
        print("\nNo saved history found in history_log.txt.")
        return
        
    print("\n==============================================")
    print("               SAVED BATCH HISTORY            ")
    print("==============================================")
    with open("history_log.txt", "r", encoding="utf-8") as f:
        print(f.read())

if __name__ == "__main__":
    choice = input("Choose action - Manual input (y), View saved history (h), or Default run (N): ").strip().lower()
    if choice in ['y', 'yes']:
        run_interactive()
    elif choice in ['h', 'history']:
        view_history()
    else:
        print("Using default database calculations:")
        run_default()
