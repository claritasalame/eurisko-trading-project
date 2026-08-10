from sqlalchemy.orm import Session

from models import Holding, UserProfile
from services.market_data import fetch_quote


def build_portfolio_snapshot(user_id, db: Session) -> dict:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    holdings = db.query(Holding).filter(Holding.user_id == user_id).order_by(Holding.created_at).all()
    valued_holdings = []
    positions_value = 0.0
    today_change = 0.0

    for holding in holdings:
        quote = fetch_quote(holding.symbol)
        current_price = quote["price"]
        change_percent = quote["day_change_percent"]
        market_value = current_price * holding.quantity
        previous_price = current_price / (1 + change_percent / 100) if change_percent != -100 else current_price
        change_amount = (current_price - previous_price) * holding.quantity
        positions_value += market_value
        today_change += change_amount
        valued_holdings.append({
            "id": holding.id,
            "symbol": holding.symbol,
            "quantity": holding.quantity,
            "average_cost_basis": holding.average_cost_basis,
            "current_price": current_price,
            "day_change_percent": change_percent,
            "market_value": round(market_value, 2),
            "today_change": round(change_amount, 2),
        })

    cash_balance = profile.cash_balance if profile else 0.0
    return {
        "cash_balance": cash_balance,
        "risk_tolerance": profile.risk_tolerance if profile else None,
        "portfolio_value": round(cash_balance + positions_value, 2),
        "today_change": round(today_change, 2),
        "holdings": valued_holdings,
    }


def format_portfolio_context(snapshot: dict) -> str:
    sections = [
        "Profile status: configured." if snapshot["risk_tolerance"] else "Profile status: not fully configured.",
        f"Cash balance: ${snapshot['cash_balance']:,.2f}",
        f"Risk tolerance: {snapshot['risk_tolerance'] or 'not provided'}",
        "",
        "Holdings:",
        "Symbol | Quantity | Cost basis | Current price | Market value",
    ]
    if not snapshot["holdings"]:
        sections.append("No holdings recorded.")
    for holding in snapshot["holdings"]:
        sections.append(
            f"{holding['symbol']} | {holding['quantity']:g} | ${holding['average_cost_basis']:,.2f} | "
            f"${holding['current_price']:,.2f} | ${holding['market_value']:,.2f}"
        )
    return "\n".join(sections)
