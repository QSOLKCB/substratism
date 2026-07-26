import matplotlib
matplotlib.use('Agg')  # headless rendering
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np
import os

# Create scratch directory
os.makedirs('/workspace/scratch', exist_ok=True)

# Set theme
sns.set_theme(style='whitegrid', palette='colorblind', font='DejaVu Sans')

# --- DATA PREPARATION ---

# Panel A: Standardized Betas (Continuous Outcomes)
# Outcomes:
# 1. Helping digital humans vs. biological human (Study 4)
# 2. Helping digital pigs vs. biological pig (Study 4)
# 3. AI vs. Human Charity Donation (Study 5)
# 4. AI vs. Animal Charity Donation (Study 5)

beta_data = {
    'Outcome': [
        'Helping Humans (S4)', 'Helping Humans (S4)', 'Helping Humans (S4)', 'Helping Humans (S4)', 'Helping Humans (S4)',
        'Helping Pigs (S4)', 'Helping Pigs (S4)', 'Helping Pigs (S4)', 'Helping Pigs (S4)', 'Helping Pigs (S4)',
        'AI vs. Human Donation (S5)', 'AI vs. Human Donation (S5)', 'AI vs. Human Donation (S5)', 'AI vs. Human Donation (S5)', 'AI vs. Human Donation (S5)',
        'AI vs. Animal Donation (S5)', 'AI vs. Animal Donation (S5)', 'AI vs. Animal Donation (S5)', 'AI vs. Animal Donation (S5)', 'AI vs. Animal Donation (S5)'
    ],
    'Predictor': [
        'Substratism', 'AI Attitudes (Pos)', 'AI Attitudes (Neg)', 'Moral Expansiveness', 'AI Interaction Freq',
        'Substratism', 'AI Attitudes (Pos)', 'AI Attitudes (Neg)', 'Moral Expansiveness', 'AI Interaction Freq',
        'Substratism', 'AI Attitudes (Pos)', 'AI Attitudes (Neg)', 'Moral Expansiveness', 'AI Interaction Freq',
        'Substratism', 'AI Attitudes (Pos)', 'AI Attitudes (Neg)', 'Moral Expansiveness', 'AI Interaction Freq'
    ],
    'Beta': [
        -0.29, 0.03, 0.05, -0.05, 0.01,
        -0.23, 0.09, 0.03, -0.09, 0.04,
        -0.25, 0.15, -0.04, -0.06, 0.07,
        -0.31, 0.05, -0.03, 0.03, 0.10
    ]
}
df_beta = pd.DataFrame(beta_data)

# Panel B: Odds Ratios (Binary Advocacy Outcomes)
# Outcomes:
# 1. Choice to learn about AI Rights Charity (Study 4)
# 2. Choice to learn about AI Rights Petition (Study 5)
or_data = {
    'Outcome': [
        'Learn About Charity (S4)', 'Learn About Charity (S4)', 'Learn About Charity (S4)', 'Learn About Charity (S4)', 'Learn About Charity (S4)',
        'Learn About Petition (S5)', 'Learn About Petition (S5)', 'Learn About Petition (S5)', 'Learn About Petition (S5)', 'Learn About Petition (S5)'
    ],
    'Predictor': [
        'Substratism', 'AI Attitudes (Pos)', 'AI Attitudes (Neg)', 'Moral Expansiveness', 'AI Interaction Freq',
        'Substratism', 'AI Attitudes (Pos)', 'AI Attitudes (Neg)', 'Moral Expansiveness', 'AI Interaction Freq'
    ],
    'OR': [
        0.66, 1.10, 1.17, 1.56, 1.18,
        0.74, 1.29, 1.24, 1.03, 1.27
    ]
}
df_or = pd.DataFrame(or_data)

# --- CHART CREATION ---
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 7.5), sharey=False)

# Custom Color Palette for Predictors to keep them consistent across both charts
predictors = ['Substratism', 'AI Attitudes (Pos)', 'AI Attitudes (Neg)', 'Moral Expansiveness', 'AI Interaction Freq']
colors = sns.color_palette('colorblind', len(predictors))
color_map = dict(zip(predictors, colors))

# --- PANEL A: STANDARDIZED BETAS ---
df_beta_pivot = df_beta.pivot(index='Outcome', columns='Predictor', values='Beta')
df_beta_pivot = df_beta_pivot.reindex(['Helping Humans (S4)', 'Helping Pigs (S4)', 'AI vs. Human Donation (S5)', 'AI vs. Animal Donation (S5)'])
df_beta_pivot = df_beta_pivot[predictors]

df_beta_pivot.plot(kind='barh', ax=ax1, color=[color_map[p] for p in predictors], width=0.8, edgecolor='black', linewidth=0.5)
ax1.axvline(0, color='gray', linestyle='--', linewidth=0.8)
ax1.set_title('Standardized Coefficients (Beta)\n(Continuous Moral & Resource Outcomes)', fontsize=12, fontweight='bold', pad=10)
ax1.set_xlabel('Standardized Coefficient (Beta)', fontsize=11)
ax1.set_ylabel('Experimental Outcomes', fontsize=11)
ax1.get_legend().remove() # Remove auto legend

# Add data labels
for container in ax1.containers:
    labels = [f'{val:+.2f}' if val != 0 else '' for val in container.datavalues]
    ax1.bar_label(container, labels=labels, padding=3, fontsize=8, fontweight='bold')

# --- PANEL B: ODDS RATIOS ---
df_or_pivot = df_or.pivot(index='Outcome', columns='Predictor', values='OR')
df_or_pivot = df_or_pivot.reindex(['Learn About Charity (S4)', 'Learn About Petition (S5)'])
df_or_pivot = df_or_pivot[predictors]

df_or_pivot.plot(kind='barh', ax=ax2, color=[color_map[p] for p in predictors], width=0.8, edgecolor='black', linewidth=0.5)
ax2.axvline(1, color='red', linestyle='--', linewidth=1, label='No Effect (OR = 1.0)')
ax2.set_title('Odds Ratios (OR)\n(Binary Advocacy Choice Outcomes)', fontsize=12, fontweight='bold', pad=10)
ax2.set_xlabel('Odds Ratio (OR)', fontsize=11)
ax2.set_ylabel('', fontsize=11)
ax2.get_legend().remove() # CRITICAL: Remove the duplicate legend!

# Add data labels
for container in ax2.containers:
    labels = [f'{val:.2f}' if val != 0 else '' for val in container.datavalues]
    ax2.bar_label(container, labels=labels, padding=3, fontsize=8, fontweight='bold')

# Style adjustments
for ax in [ax1, ax2]:
    ax.tick_params(labelsize=10)
    ax.invert_yaxis()  # read top-to-bottom

# Unified Legend Setup
handles, labels = ax1.get_legend_handles_labels()
line_handle = plt.Line2D([0], [0], color='red', linestyle='--', linewidth=1)
handles.append(line_handle)
labels.append('No Effect (OR = 1.0)')

# Place legend cleanly at the bottom
fig.legend(handles, labels, loc='lower center', ncol=3, bbox_to_anchor=(0.5, -0.06), fontsize=10, frameon=True, facecolor='white', edgecolor='gray')

# Figure Main Title
fig.suptitle('Substratism Dominates AI Moral Devaluation and Resource Choices\nWith Effect Sizes Up to 10x Larger Than General Attitudes and Moral Expansiveness', 
             fontsize=15, fontweight='bold', y=0.98, ha='center')

# Footer / Source Note (moved slightly down/left to avoid any potential overlaps)
fig.text(0.01, -0.08, 'Source: Ladak et al. (2026) "Substratism: Conceptualizing and measuring moral bias against AI"', fontsize=8, color='gray', style='italic')

sns.despine()
plt.tight_layout(rect=[0, 0.02, 1, 0.92])

# Save output
output_path = '/workspace/scratch/substratism_regression_coefficients.png'
plt.savefig(output_path, dpi=150, bbox_inches='tight')
plt.close()

print(f"Visualization generated successfully at: {output_path}")
