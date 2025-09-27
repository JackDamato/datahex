# tools/visualization.py
import os
from typing import Dict, Any, List, Optional
import pandas as pd
import plotly.express as px

UPLOADS_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

def _dataset_path(dataset_id: str) -> str:
    pq = os.path.join(UPLOADS_DIR, f"{dataset_id}.parquet")
    csv = os.path.join(UPLOADS_DIR, f"{dataset_id}.csv")
    if os.path.exists(pq):
        return pq
    if os.path.exists(csv):
        return csv
    raise FileNotFoundError(f"Dataset not found for id: {dataset_id}")

def _ensure_df(dataset_id_or_path: str) -> pd.DataFrame:
    if os.path.isfile(dataset_id_or_path):
        path = dataset_id_or_path
    else:
        path = _dataset_path(dataset_id_or_path)
    return pd.read_parquet(path) if path.endswith(".parquet") else pd.read_csv(path)

def generate_plotly_chart(dataset_id_or_path: str, chart_type: str, columns: List[str], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    df = _ensure_df(dataset_id_or_path)
    options = options or {}
    chart_type = chart_type.lower()

    fig = None
    cols = [c for c in columns if c in df.columns]
    if chart_type == "histogram" and cols:
        fig = px.histogram(df, x=cols[0], nbins=options.get("nbins", 30))
    elif chart_type == "scatter" and len(cols) >= 2:
        fig = px.scatter(df, x=cols[0], y=cols[1], color=options.get("color") or (cols[2] if len(cols) > 2 else None))
    elif chart_type == "line" and len(cols) >= 2:
        fig = px.line(df, x=cols[0], y=cols[1], color=options.get("color"))
    elif chart_type == "bar" and len(cols) >= 2:
        fig = px.bar(df, x=cols[0], y=cols[1], color=options.get("color"))
    elif chart_type == "heatmap":
        corr = df.select_dtypes("number").corr()
        fig = px.imshow(corr, text_auto=True, aspect="auto", color_continuous_scale="RdBu")
    elif chart_type == "box" and cols:
        fig = px.box(df, y=cols[0], color=options.get("color"))
    elif chart_type == "violin" and cols:
        fig = px.violin(df, y=cols[0], color=options.get("color"), box=True, points="all")
    else:
        # fallback to histogram on the first numeric if available
        num_cols = df.select_dtypes("number").columns.tolist()
        if num_cols:
            fig = px.histogram(df, x=num_cols[0], nbins=options.get("nbins", 30))
        else:
            # last resort: first column as categorical histogram
            fig = px.histogram(df, x=df.columns[0])

    plotly_json = fig.to_dict()
    
    # Generate PNG preview if requested
    png_preview = ""
    if options.get("format") == "png":
        try:
            import base64
            import io
            from PIL import Image, ImageDraw, ImageFont
            import numpy as np
            
            # Set figure size if specified
            width = options.get("width", 800)
            height = options.get("height", 600)
            
            # Create a simple image with chart information
            img = Image.new('RGB', (width, height), color='white')
            draw = ImageDraw.Draw(img)
            
            # Try to use a default font, fallback to basic if not available
            try:
                font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 20)
                title_font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
            except:
                font = ImageFont.load_default()
                title_font = ImageFont.load_default()
            
            # Draw title
            title = f"{chart_type.title()} Chart"
            if chart_type == "scatter" and len(cols) >= 2:
                title = f"Scatter Plot: {cols[0]} vs {cols[1]}"
            elif chart_type == "histogram" and cols:
                title = f"Histogram of {cols[0]}"
            elif chart_type == "line" and len(cols) >= 2:
                title = f"Line Plot: {cols[0]} vs {cols[1]}"
            elif chart_type == "bar" and len(cols) >= 2:
                title = f"Bar Chart: {cols[0]} vs {cols[1]}"
            
            # Draw title
            draw.text((width//2 - len(title)*6, 30), title, fill='black', font=title_font)
            
            # Draw basic chart representation
            if chart_type == "scatter" and len(cols) >= 2:
                # Simple scatter plot representation
                x_data = df[cols[0]].dropna()
                y_data = df[cols[1]].dropna()
                if len(x_data) > 0 and len(y_data) > 0:
                    x_min, x_max = x_data.min(), x_data.max()
                    y_min, y_max = y_data.min(), y_data.max()
                    
                    # Scale data to image coordinates
                    margin = 100
                    plot_width = width - 2 * margin
                    plot_height = height - 2 * margin - 60
                    
                    for i in range(min(len(x_data), 1000)):  # Limit points for performance
                        x = int(margin + (x_data.iloc[i] - x_min) / (x_max - x_min) * plot_width)
                        y = int(margin + 60 + (y_data.iloc[i] - y_min) / (y_max - y_min) * plot_height)
                        if margin <= x < width - margin and margin + 60 <= y < height - margin:
                            draw.ellipse([x-2, y-2, x+2, y+2], fill='blue', outline='blue')
                    
                    # Draw axes
                    draw.line([margin, margin + 60, margin, height - margin], fill='black', width=2)
                    draw.line([margin, height - margin, width - margin, height - margin], fill='black', width=2)
                    
                    # Draw labels
                    draw.text((margin - 50, height//2), cols[1], fill='black', font=font)
                    draw.text((width//2, height - margin + 10), cols[0], fill='black', font=font)
            
            elif chart_type == "histogram" and cols:
                # Simple histogram representation
                data = df[cols[0]].dropna()
                if len(data) > 0:
                    margin = 100
                    plot_width = width - 2 * margin
                    plot_height = height - 2 * margin - 60
                    
                    # Create histogram bins
                    bins = np.histogram(data, bins=min(20, len(data)//2))
                    bin_heights = bins[0]
                    bin_edges = bins[1]
                    
                    if len(bin_heights) > 0:
                        max_height = max(bin_heights)
                        bar_width = plot_width // len(bin_heights)
                        
                        for i, height in enumerate(bin_heights):
                            bar_height = int((height / max_height) * plot_height) if max_height > 0 else 0
                            x1 = margin + i * bar_width
                            y1 = height - margin - bar_height
                            x2 = x1 + bar_width - 2
                            y2 = height - margin
                            draw.rectangle([x1, y1, x2, y2], fill='blue', outline='blue')
                    
                    # Draw axes
                    draw.line([margin, margin + 60, margin, height - margin], fill='black', width=2)
                    draw.line([margin, height - margin, width - margin, height - margin], fill='black', width=2)
                    
                    # Draw labels
                    draw.text((margin - 50, height//2), 'Count', fill='black', font=font)
                    draw.text((width//2, height - margin + 10), cols[0], fill='black', font=font)
            
            # Add metadata
            info_text = f"Data points: {len(df)}, Columns: {', '.join(cols[:3])}"
            draw.text((20, height - 30), info_text, fill='gray', font=font)
            
            # Convert to base64
            img_buffer = io.BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            png_preview = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
            
        except ImportError as e:
            logger.warning(f"PIL not available for PNG generation: {e}")
        except Exception as e:
            logger.warning(f"Failed to generate PNG preview: {e}")

    return {
        "chart_type": chart_type,
        "columns_used": cols,
        "plotly_json": plotly_json,
        "png_preview": png_preview,
        "png_data": png_preview,  # Also include as png_data for compatibility
        "metadata": {"row_count": int(df.shape[0]), "col_count": int(df.shape[1])},
    }

def create_chart_gallery(dataset_id_or_path: str, columns: List[str]) -> Dict[str, Any]:
    available = ["histogram", "scatter", "line", "bar", "heatmap", "box", "violin"]
    gallery = {}
    meta = {}
    for ctype in available:
        try:
            gallery[ctype] = generate_plotly_chart(dataset_id_or_path, ctype, columns)
        except Exception as _:
            gallery[ctype] = {"error": f"Failed {ctype}"}
    meta["row_count"] = gallery.get("histogram", {}).get("metadata", {}).get("row_count", 0)
    return {"gallery": gallery, "available_charts": available, "metadata": meta}

def get_chart_recommendations(dataset_id_or_path: str, columns: List[str]) -> List[Dict[str, Any]]:
    df = _ensure_df(dataset_id_or_path)
    recs = []
    if len(columns) == 1 and pd.api.types.is_numeric_dtype(df[columns[0]]):
        recs.append({"chart_type": "histogram", "reason": "Single numeric column"})
        recs.append({"chart_type": "box", "reason": "Distribution and outliers"})
    if len(columns) >= 2 and all(col in df.columns for col in columns[:2]):
        recs.append({"chart_type": "scatter", "reason": "Relationship between two variables"})
        recs.append({"chart_type": "line", "reason": "Temporal or ordered series"})
        recs.append({"chart_type": "bar", "reason": "Categorical comparison"})
    recs.append({"chart_type": "heatmap", "reason": "Overall numeric correlations"})
    return recs

def create_test_visualization_dataset(dataset_id: str) -> str:
    import numpy as np
    np.random.seed(42)
    n = 200
    df = pd.DataFrame({
        "age": np.random.randint(18, 65, size=n),
        "salary": np.random.randint(30000, 150000, size=n),
        "score": np.random.normal(70, 10, size=n),
        "dept": np.random.choice(["Engineering", "Sales", "HR", "Marketing"], size=n),
        "gender": np.random.choice(["Male", "Female"], size=n),
    })
    out = os.path.join(UPLOADS_DIR, f"{dataset_id}.parquet")
    df.to_parquet(out, index=False)
    return out